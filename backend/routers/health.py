from fastapi import APIRouter

from services.database import check_database_health

router = APIRouter(prefix="/health", tags=["database"])


@router.get("/database")
async def database_health():
    is_healthy = await check_database_health()
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "service": "database",
    }
