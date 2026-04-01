import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.auth import User
from models.comments import Comments
from models.notifications import Notifications
from models.papers import Papers
from models.reports import Reports
from models.solutions import Solutions
from models.user_profiles import User_profiles
from routers.notifications import create_notification
from schemas.auth import UserResponse
from services.auth import ensure_user_profile_record

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/community", tags=["community"])

AUTO_HIDE_REPORT_THRESHOLD = 3
TRUST_SCORE_FOR_VERIFIED_CONTRIBUTOR = 50
ROLE_VERIFICATION_MAP = {
    "admin": "verified",
    "content_manager": "verified",
    "cp": "verified",
    "lecturer": "verified",
    "verified_contributor": "community",
}


class CommunityCommentCreate(BaseModel):
    content: str = Field(min_length=1)
    parent_id: Optional[int] = None


class CommunitySolutionCreate(BaseModel):
    content: str = Field(min_length=1)


class CommunityReportCreate(BaseModel):
    reason: str = Field(min_length=3)


class CommunityPaperCreate(BaseModel):
    title: str
    course_code: str
    course_name: str
    college: str
    department: str
    year: int
    paper_type: str
    lecturer: Optional[str] = None
    description: Optional[str] = None
    file_key: Optional[str] = None
    solution_key: Optional[str] = None
    verification_status: str = "unverified"
    download_count: int = 0
    report_count: int = 0
    is_hidden: bool = False


class UserProfileResponse(BaseModel):
    id: int
    user_id: str
    display_name: str
    role: str
    trust_score: int
    upload_count: int
    download_count: int
    institution_type: Optional[str] = None
    university_name: Optional[str] = None
    ur_student_code: Optional[str] = None
    ur_verification_status: Optional[str] = None
    profile_picture_key: Optional[str] = None
    phone_number: Optional[str] = None
    college_name: Optional[str] = None
    department_name: Optional[str] = None
    year_of_study: Optional[str] = None
    bio: Optional[str] = None
    requested_role: Optional[str] = None
    requested_role_status: Optional[str] = None
    account_status: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    items: list[UserProfileResponse]


class UserProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    institution_type: Optional[str] = None
    university_name: Optional[str] = None
    ur_student_code: Optional[str] = None
    profile_picture_key: Optional[str] = None
    phone_number: Optional[str] = None
    college_name: Optional[str] = None
    department_name: Optional[str] = None
    year_of_study: Optional[str] = None
    bio: Optional[str] = None


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _get_profile(db: AsyncSession, user_id: str) -> Optional[User_profiles]:
    result = await db.execute(select(User_profiles).where(User_profiles.user_id == user_id))
    return result.scalar_one_or_none()


async def _ensure_profile(db: AsyncSession, current_user: UserResponse) -> User_profiles:
    profile = await _get_profile(db, str(current_user.id))
    if profile:
        return profile

    display_name = current_user.name or current_user.email or f"Student {current_user.id}"
    role = current_user.role if current_user.role in ROLE_VERIFICATION_MAP or current_user.role == "normal" else "normal"
    profile = User_profiles(
        user_id=str(current_user.id),
        display_name=display_name,
        role=role,
        trust_score=100 if role == "admin" else 0,
        upload_count=0,
        download_count=0,
        institution_type=None,
        university_name=None,
        ur_student_code=None,
        ur_verification_status="not_requested",
        profile_picture_key=None,
        phone_number=None,
        college_name=None,
        department_name=None,
        year_of_study=None,
        bio=None,
        requested_role=None,
        requested_role_status="none",
        account_status="active",
        created_at=_utcnow(),
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


def _verification_for_profile(profile: User_profiles) -> str:
    if profile.role in ROLE_VERIFICATION_MAP:
        return ROLE_VERIFICATION_MAP[profile.role]
    if (profile.trust_score or 0) >= TRUST_SCORE_FOR_VERIFIED_CONTRIBUTOR:
        return "community"
    return "unverified"


async def _refresh_trust_role(profile: User_profiles, db: AsyncSession) -> None:
    trust_score = profile.trust_score or 0
    if profile.role == "normal" and trust_score >= TRUST_SCORE_FOR_VERIFIED_CONTRIBUTOR:
        profile.role = "verified_contributor"
    elif profile.role == "verified_contributor" and trust_score < TRUST_SCORE_FOR_VERIFIED_CONTRIBUTOR:
        profile.role = "normal"
    await db.flush()


@router.get("/profile", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _ensure_profile(db, current_user)


@router.patch("/profile", response_model=UserProfileResponse)
async def update_my_profile(
    payload: UserProfileUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == str(current_user.id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        profile = await ensure_user_profile_record(db, user, payload.model_dump(exclude_unset=True))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User_profiles).order_by(
            desc(func.coalesce(User_profiles.trust_score, 0)),
            desc(func.coalesce(User_profiles.upload_count, 0)),
        ).limit(10)
    )
    return {"items": result.scalars().all()}


@router.post("/papers")
async def create_paper(
    payload: CommunityPaperCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _ensure_profile(db, current_user)
    paper = Papers(
        user_id=str(current_user.id),
        title=payload.title,
        course_code=payload.course_code,
        course_name=payload.course_name,
        college=payload.college,
        department=payload.department,
        year=payload.year,
        paper_type=payload.paper_type,
        lecturer=payload.lecturer,
        description=payload.description,
        file_key=payload.file_key,
        solution_key=payload.solution_key,
        verification_status=_verification_for_profile(profile),
        download_count=0,
        report_count=0,
        is_hidden=False,
        created_at=_utcnow(),
    )
    db.add(paper)
    profile.upload_count = (profile.upload_count or 0) + 1
    profile.trust_score = (profile.trust_score or 0) + 2
    await _refresh_trust_role(profile, db)
    await db.flush()
    await create_notification(
        db,
        str(current_user.id),
        "Upload submitted",
        f'"{paper.title}" was submitted successfully and is awaiting community review.',
        "upload",
        "paper",
        paper.id,
    )
    await db.commit()
    await db.refresh(paper)
    return paper


@router.post("/papers/{paper_id}/comments")
async def add_comment(
    paper_id: int,
    payload: CommunityCommentCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    paper = await db.get(Papers, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    await _ensure_profile(db, current_user)
    comment = Comments(
        user_id=str(current_user.id),
        paper_id=paper_id,
        content=payload.content.strip(),
        parent_id=payload.parent_id,
        upvotes=0,
        created_at=_utcnow(),
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


@router.post("/papers/{paper_id}/solutions")
async def add_solution(
    paper_id: int,
    payload: CommunitySolutionCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    paper = await db.get(Papers, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    profile = await _ensure_profile(db, current_user)
    solution = Solutions(
        user_id=str(current_user.id),
        paper_id=paper_id,
        content=payload.content.strip(),
        upvotes=0,
        is_best=False,
        created_at=_utcnow(),
    )
    profile.trust_score = (profile.trust_score or 0) + 1
    await _refresh_trust_role(profile, db)
    db.add(solution)
    await db.commit()
    await db.refresh(solution)
    return solution


@router.post("/papers/{paper_id}/report")
async def report_paper(
    paper_id: int,
    payload: CommunityReportCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    paper = await db.get(Papers, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    existing = await db.execute(
        select(Reports).where(Reports.paper_id == paper_id, Reports.user_id == str(current_user.id))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="You have already reported this paper")

    report = Reports(
        user_id=str(current_user.id),
        paper_id=paper_id,
        reason=payload.reason.strip(),
        status="pending",
        created_at=_utcnow(),
    )
    db.add(report)

    paper.report_count = (paper.report_count or 0) + 1
    if paper.report_count >= AUTO_HIDE_REPORT_THRESHOLD:
        paper.is_hidden = True

    owner_profile = await _get_profile(db, paper.user_id)
    if owner_profile:
        owner_profile.trust_score = max(0, (owner_profile.trust_score or 0) - 5)
        await _refresh_trust_role(owner_profile, db)
    await create_notification(
        db,
        paper.user_id,
        "Paper reported",
        f'"{paper.title}" was reported by the community. Moderators may review it soon.',
        "report",
        "paper",
        paper.id,
    )

    await db.commit()
    await db.refresh(report)
    return {
        "report": report,
        "paper": {
            "id": paper.id,
            "report_count": paper.report_count,
            "is_hidden": paper.is_hidden,
        },
    }


@router.post("/solutions/{solution_id}/upvote")
async def upvote_solution(
    solution_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    solution = await db.get(Solutions, solution_id)
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    solution.upvotes = (solution.upvotes or 0) + 1
    if solution.upvotes >= 5:
        solution.is_best = True

    profile = await _get_profile(db, solution.user_id)
    if profile:
        profile.trust_score = (profile.trust_score or 0) + 2
        await _refresh_trust_role(profile, db)

    await db.commit()
    await db.refresh(solution)
    return solution


@router.post("/comments/{comment_id}/upvote")
async def upvote_comment(
    comment_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await db.get(Comments, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.upvotes = (comment.upvotes or 0) + 1
    profile = await _get_profile(db, comment.user_id)
    if profile:
        profile.trust_score = (profile.trust_score or 0) + 1
        await _refresh_trust_role(profile, db)

    await db.commit()
    await db.refresh(comment)
    return comment


@router.post("/papers/{paper_id}/record-download")
async def record_download(
    paper_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    paper = await db.get(Papers, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    profile = await _ensure_profile(db, current_user)
    profile.download_count = (profile.download_count or 0) + 1
    paper.download_count = (paper.download_count or 0) + 1
    await db.commit()
    return {"download_count": paper.download_count}
