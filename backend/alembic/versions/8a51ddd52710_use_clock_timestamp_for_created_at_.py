"""use clock_timestamp for created_at/updated_at defaults

Revision ID: 8a51ddd52710
Revises: 8189ede77515
Create Date: 2026-09-18 02:54:54.679702

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8a51ddd52710'
down_revision: Union[str, None] = '8189ede77515'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # now()/CURRENT_TIMESTAMP is frozen for the lifetime of a transaction in
    # Postgres, so several analyses created in one transaction would get an
    # identical created_at and sort unpredictably. clock_timestamp() reflects
    # actual statement execution time instead.
    op.alter_column("analyses", "created_at", server_default=sa.text("clock_timestamp()"))
    op.alter_column("analyses", "updated_at", server_default=sa.text("clock_timestamp()"))
    op.alter_column("detections", "created_at", server_default=sa.text("clock_timestamp()"))


def downgrade() -> None:
    op.alter_column("analyses", "created_at", server_default=sa.text("now()"))
    op.alter_column("analyses", "updated_at", server_default=sa.text("now()"))
    op.alter_column("detections", "created_at", server_default=sa.text("now()"))
