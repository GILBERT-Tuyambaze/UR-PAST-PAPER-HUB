import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.notifications import Notifications
from schemas.auth import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


class NotificationResponse(BaseModel):
    id: int
    user_id: str
    title: str
    message: str
    notification_type: str
    is_read: Optional[bool] = None
    related_entity: Optional[str] = None
    related_entity_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]


class NotificationReadRequest(BaseModel):
    is_read: bool = True


def utcnow():
    return datetime.now(timezone.utc)


async def create_notification(
    db: AsyncSession,
    user_id: str,
    title: str,
    message: str,
    notification_type: str,
    related_entity: str | None = None,
    related_entity_id: int | None = None,
) -> Notifications:
    notification = Notifications(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
        related_entity=related_entity,
        related_entity_id=related_entity_id,
        created_at=utcnow(),
    )
    db.add(notification)
    await db.flush()
    return notification


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notifications)
        .where(Notifications.user_id == str(current_user.id))
        .order_by(desc(Notifications.created_at))
        .limit(100)
    )
    return {"items": result.scalars().all()}


@router.patch("/{notification_id}", response_model=NotificationResponse)
async def mark_notification(
    notification_id: int,
    payload: NotificationReadRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notification = await db.get(Notifications, notification_id)
    if not notification or notification.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = payload.is_read
    await db.commit()
    await db.refresh(notification)
    return notification


@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Notifications).where(Notifications.user_id == str(current_user.id)))
    items = result.scalars().all()
    for notification in items:
        notification.is_read = True
    await db.commit()
    return {"updated": len(items)}
