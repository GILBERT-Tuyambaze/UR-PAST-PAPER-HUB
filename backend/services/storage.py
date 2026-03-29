import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional
from urllib.parse import quote

import httpx

from core.config import settings
from schemas.storage import (
    BucketInfo,
    BucketListResponse,
    BucketRequest,
    BucketResponse,
    DeleteResponse,
    FileUpDownRequest,
    FileUpDownResponse,
    ObjectInfo,
    ObjectListResponse,
    ObjectRequest,
    OSSBaseModel,
    RenameRequest,
    RenameResponse,
)

logger = logging.getLogger(__name__)


class StorageService:
    """Supabase Storage-backed file service."""

    def __init__(self):
        self.project_url = (
            getattr(settings, "supabase_url", None) or getattr(settings, "oss_service_url", None) or ""
        ).rstrip("/")
        self.service_key = (
            getattr(settings, "supabase_service_role_key", None)
            or getattr(settings, "supabase_service_key", None)
            or getattr(settings, "oss_api_key", None)
            or ""
        ).strip()
        self.default_bucket = (getattr(settings, "supabase_bucket", None) or "").strip()

        if not self.project_url or not self.service_key:
            raise ValueError(
                "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY "
                "(or OSS_SERVICE_URL and OSS_API_KEY)."
            )
        if self.service_key.startswith("sb_publishable_"):
            raise ValueError(
                "SUPABASE_SERVICE_ROLE_KEY is set to a publishable key. "
                "Use the Supabase service_role key for backend storage operations."
            )

        self.api_base_url = f"{self.project_url}/storage/v1"
        self.headers = {
            "Authorization": f"Bearer {self.service_key}",
            "apikey": self.service_key,
            "Accept": "application/json",
        }

    async def create_bucket(self, request: BucketRequest) -> BucketResponse:
        payload = {
            "id": request.bucket_name,
            "name": request.bucket_name,
            "public": request.visibility == "public",
        }
        try:
            result = await self._request("POST", "/bucket", json=payload)
            bucket_name = result.get("id") or result.get("name") or request.bucket_name
            return BucketResponse(
                bucket_name=bucket_name,
                visibility="public" if result.get("public") else "private",
                created_at=result.get("created_at", ""),
            )
        except ValueError as exc:
            if self._is_already_exists_error(exc):
                return BucketResponse(
                    bucket_name=request.bucket_name,
                    visibility=request.visibility,
                    created_at="",
                )
            logger.error("Failed to create bucket: %s", exc)
            raise

    async def list_buckets(self) -> BucketListResponse:
        result = await self._request("GET", "/bucket")
        items = result if isinstance(result, list) else result.get("buckets", []) if isinstance(result, dict) else []
        return BucketListResponse(
            buckets=[
                BucketInfo(
                    bucket_name=item.get("id") or item.get("name") or "",
                    visibility="public" if item.get("public") else "private",
                )
                for item in items
            ]
        )

    async def list_objects(self, request: OSSBaseModel) -> ObjectListResponse:
        await self._ensure_bucket(request.bucket_name)
        result = await self._request(
            "POST",
            f"/object/list/{self._quote_bucket(request.bucket_name)}",
            json={"limit": 1000, "offset": 0},
        )
        items = result if isinstance(result, list) else []
        objects = [
            ObjectInfo(
                bucket_name=request.bucket_name,
                object_key=item.get("name", ""),
                size=item.get("metadata", {}).get("size") or item.get("size") or 0,
                last_modified=item.get("updated_at") or item.get("last_accessed_at") or "",
                etag=item.get("id") or "",
            )
            for item in items
        ]
        return ObjectListResponse(objects=objects)

    async def get_object_info(self, request: ObjectRequest) -> ObjectInfo:
        await self._ensure_bucket(request.bucket_name)
        try:
            result = await self._request("GET", f"/object/info/{self._object_path(request.bucket_name, request.object_key)}")
        except ValueError:
            result = await self._find_object_via_listing(request.bucket_name, request.object_key)
            if result is None:
                raise

        return ObjectInfo(
            bucket_name=request.bucket_name,
            object_key=result.get("name") or request.object_key,
            size=result.get("metadata", {}).get("size") or result.get("size") or 0,
            last_modified=result.get("updated_at") or result.get("last_accessed_at") or "",
            etag=result.get("id") or "",
        )

    async def rename_object(self, request: RenameRequest) -> RenameResponse:
        await self._ensure_bucket(request.bucket_name)
        payload = {
            "bucketId": request.bucket_name,
            "sourceKey": request.source_key,
            "destinationBucket": request.bucket_name,
            "destinationKey": request.target_key,
        }
        await self._request("POST", "/object/move", json=payload)
        return RenameResponse(success=True)

    async def delete_object(self, request: ObjectRequest) -> DeleteResponse:
        await self._request("DELETE", f"/object/{self._object_path(request.bucket_name, request.object_key)}")
        return DeleteResponse(success=True)

    async def upload_file(
        self,
        bucket_name: str,
        object_key: str,
        file_bytes: bytes,
        content_type: Optional[str] = None,
    ) -> str:
        target_bucket = self._storage_bucket(bucket_name)
        await self._ensure_bucket(target_bucket)
        upload_headers = {
            **self.headers,
            "Content-Type": content_type or "application/octet-stream",
            "x-upsert": "false",
        }
        await self._request(
            "POST",
            f"/object/{self._object_path(target_bucket, object_key)}",
            content=file_bytes,
            headers=upload_headers,
        )
        return object_key

    async def create_upload_url(self, request: FileUpDownRequest) -> FileUpDownResponse:
        raise ValueError(
            "Signed upload URLs are not used with the Supabase storage backend. "
            "Use the authenticated /api/v1/storage/upload endpoint instead."
        )

    async def create_download_url(self, request: FileUpDownRequest) -> FileUpDownResponse:
        target_bucket = self._storage_bucket(request.bucket_name)
        await self._ensure_bucket(target_bucket)
        result = await self._request(
            "POST",
            f"/object/sign/{self._object_path(target_bucket, request.object_key)}",
            json={"expiresIn": 3600, "download": True},
        )

        relative_url = result.get("signedURL") or result.get("signedUrl") or result.get("signed_url")
        if not relative_url:
            raise ValueError("Supabase did not return a signed download URL.")

        return FileUpDownResponse(
            download_url=self._absolute_storage_url(relative_url),
            expires_at=self._expires_at(hours=1),
        )

    async def _ensure_bucket(self, bucket_name: str) -> None:
        try:
            await self.create_bucket(BucketRequest(bucket_name=bucket_name, visibility="private"))
        except ValueError as exc:
            if self._is_already_exists_error(exc):
                return
            raise

    async def _find_object_via_listing(self, bucket_name: str, object_key: str) -> Optional[dict[str, Any]]:
        prefix = object_key.rsplit("/", 1)[0] if "/" in object_key else ""
        result = await self._request(
            "POST",
            f"/object/list/{self._quote_bucket(bucket_name)}",
            json={"limit": 1000, "offset": 0, "prefix": prefix},
        )
        target_name = object_key.split("/")[-1]
        for item in result if isinstance(result, list) else []:
            if item.get("name") == target_name:
                return item
        return None

    async def _request(
        self,
        method: Literal["GET", "POST", "DELETE"],
        path: str,
        json: Optional[dict[str, Any]] = None,
        content: Optional[bytes] = None,
        headers: Optional[dict[str, str]] = None,
    ) -> Any:
        url = f"{self.api_base_url}{path}"
        request_headers = headers or self.headers

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=request_headers,
                    json=json,
                    content=content,
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text.strip()
            if exc.response.status_code in {401, 403} and self.service_key.startswith("sb_publishable_"):
                detail = (
                    f"{detail} Supabase rejected the publishable key. "
                    "Use SUPABASE_SERVICE_ROLE_KEY for backend storage operations."
                ).strip()
            raise ValueError(
                f"Supabase storage HTTP error: {exc.response.status_code} - {detail or 'Unknown error'}"
            ) from exc
        except httpx.HTTPError as exc:
            raise ValueError(f"Supabase storage request failed: {exc}") from exc

        if not response.content:
            return {}
        if "application/json" in response.headers.get("content-type", ""):
            return response.json()
        return response.text

    def _quote_bucket(self, bucket_name: str) -> str:
        return quote(bucket_name, safe="")

    def _object_path(self, bucket_name: str, object_key: str) -> str:
        return f"{self._quote_bucket(bucket_name)}/{quote(object_key, safe='/')}"

    def _storage_bucket(self, bucket_name: str) -> str:
        return self.default_bucket or bucket_name

    def _absolute_storage_url(self, relative_url: str) -> str:
        if relative_url.startswith("http://") or relative_url.startswith("https://"):
            return relative_url
        if not relative_url.startswith("/"):
            relative_url = f"/{relative_url}"
        return f"{self.api_base_url}{relative_url}"

    def _expires_at(self, hours: int = 0, minutes: int = 0) -> str:
        return (datetime.now(timezone.utc) + timedelta(hours=hours, minutes=minutes)).isoformat()

    def _is_already_exists_error(self, exc: ValueError) -> bool:
        message = str(exc).lower()
        return "already exists" in message or "duplicate" in message or "bucketid already exists" in message
