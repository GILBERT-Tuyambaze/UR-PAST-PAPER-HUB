from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class PaperInteractions(Base):
    __tablename__ = "paper_interactions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False, index=True)
    paper_id = Column(Integer, nullable=False, index=True)
    view_count = Column(Integer, nullable=True)
    download_count = Column(Integer, nullable=True)
    interest_score = Column(Integer, nullable=True)
    last_viewed_at = Column(DateTime(timezone=True), nullable=True)
    last_downloaded_at = Column(DateTime(timezone=True), nullable=True)
    last_interacted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
