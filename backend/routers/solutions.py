import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.solutions import SolutionsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/solutions", tags=["solutions"])


# ---------- Pydantic Schemas ----------
class SolutionsData(BaseModel):
    """Entity data schema (for create/update)"""
    paper_id: int
    content: str
    file_key: str = None
    upvotes: int = None
    is_best: bool = None
    created_at: Optional[datetime] = None


class SolutionsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    paper_id: Optional[int] = None
    content: Optional[str] = None
    file_key: Optional[str] = None
    upvotes: Optional[int] = None
    is_best: Optional[bool] = None
    created_at: Optional[datetime] = None


class SolutionsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    paper_id: int
    content: str
    file_key: Optional[str] = None
    upvotes: Optional[int] = None
    is_best: Optional[bool] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SolutionsListResponse(BaseModel):
    """List response schema"""
    items: List[SolutionsResponse]
    total: int
    skip: int
    limit: int


class SolutionsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[SolutionsData]


class SolutionsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: SolutionsUpdateData


class SolutionsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[SolutionsBatchUpdateItem]


class SolutionsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=SolutionsListResponse)
async def query_solutionss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query solutionss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying solutionss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = SolutionsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} solutionss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying solutionss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=SolutionsListResponse)
async def query_solutionss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query solutionss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying solutionss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = SolutionsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} solutionss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying solutionss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=SolutionsResponse)
async def get_solutions(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single solutions by ID (user can only see their own records)"""
    logger.debug(f"Fetching solutions with id: {id}, fields={fields}")
    
    service = SolutionsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Solutions with id {id} not found")
            raise HTTPException(status_code=404, detail="Solutions not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching solutions {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=SolutionsResponse, status_code=201)
async def create_solutions(
    data: SolutionsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new solutions"""
    logger.debug(f"Creating new solutions with data: {data}")
    
    service = SolutionsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create solutions")
        
        logger.info(f"Solutions created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating solutions: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating solutions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[SolutionsResponse], status_code=201)
async def create_solutionss_batch(
    request: SolutionsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple solutionss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} solutionss")
    
    service = SolutionsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} solutionss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[SolutionsResponse])
async def update_solutionss_batch(
    request: SolutionsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple solutionss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} solutionss")
    
    service = SolutionsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} solutionss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=SolutionsResponse)
async def update_solutions(
    id: int,
    data: SolutionsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing solutions (requires ownership)"""
    logger.debug(f"Updating solutions {id} with data: {data}")

    service = SolutionsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Solutions with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Solutions not found")
        
        logger.info(f"Solutions {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating solutions {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating solutions {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_solutionss_batch(
    request: SolutionsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple solutionss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} solutionss")
    
    service = SolutionsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} solutionss successfully")
        return {"message": f"Successfully deleted {deleted_count} solutionss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_solutions(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single solutions by ID (requires ownership)"""
    logger.debug(f"Deleting solutions with id: {id}")
    
    service = SolutionsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Solutions with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Solutions not found")
        
        logger.info(f"Solutions {id} deleted successfully")
        return {"message": "Solutions deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting solutions {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")