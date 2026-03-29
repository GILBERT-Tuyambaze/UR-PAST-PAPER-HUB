"""auto update

Revision ID: f97c229ef883
Revises:
Create Date: 2026-03-27
"""

from alembic import op
import sqlalchemy as sa


revision = "f97c229ef883"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("paper_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("upvotes", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_comments_id", "comments", ["id"], unique=False)

    op.create_table(
        "papers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("course_code", sa.String(), nullable=False),
        sa.Column("course_name", sa.String(), nullable=False),
        sa.Column("college", sa.String(), nullable=False),
        sa.Column("department", sa.String(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("paper_type", sa.String(), nullable=False),
        sa.Column("lecturer", sa.String(), nullable=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("file_key", sa.String(), nullable=True),
        sa.Column("solution_key", sa.String(), nullable=True),
        sa.Column("verification_status", sa.String(), nullable=False),
        sa.Column("download_count", sa.Integer(), nullable=True),
        sa.Column("report_count", sa.Integer(), nullable=True),
        sa.Column("is_hidden", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_papers_id", "papers", ["id"], unique=False)

    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("paper_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reports_id", "reports", ["id"], unique=False)

    op.create_table(
        "solutions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("paper_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("file_key", sa.String(), nullable=True),
        sa.Column("upvotes", sa.Integer(), nullable=True),
        sa.Column("is_best", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_solutions_id", "solutions", ["id"], unique=False)

    op.create_table(
        "user_profiles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("display_name", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("trust_score", sa.Integer(), nullable=True),
        sa.Column("upload_count", sa.Integer(), nullable=True),
        sa.Column("download_count", sa.Integer(), nullable=True),
        sa.Column("account_status", sa.String(), nullable=True),
        sa.Column("suspension_reason", sa.String(), nullable=True),
        sa.Column("suspended_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_profiles_id", "user_profiles", ["id"], unique=False)


def downgrade():
    op.drop_index("ix_user_profiles_id", table_name="user_profiles")
    op.drop_table("user_profiles")
    op.drop_index("ix_solutions_id", table_name="solutions")
    op.drop_table("solutions")
    op.drop_index("ix_reports_id", table_name="reports")
    op.drop_table("reports")
    op.drop_index("ix_papers_id", table_name="papers")
    op.drop_table("papers")
    op.drop_index("ix_comments_id", table_name="comments")
    op.drop_table("comments")
