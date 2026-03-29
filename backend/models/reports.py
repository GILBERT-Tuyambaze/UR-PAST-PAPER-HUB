from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class Reports(Base):
    __tablename__ = "reports"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    paper_id = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)