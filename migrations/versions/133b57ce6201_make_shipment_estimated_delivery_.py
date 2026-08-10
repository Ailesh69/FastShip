"""make shipment.estimated_delivery timezone aware

Revision ID: 133b57ce6201
Revises: c289a65cb8bd
Create Date: 2026-08-09 19:20:02.321633

"""
from typing import Sequence, Union
import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '133b57ce6201'
down_revision: Union[str, Sequence[str], None] = 'c289a65cb8bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Existing values are naive and were written by a server calling
    # datetime.now() with no tzinfo, i.e. in the server's local zone. AT TIME
    # ZONE names the zone those readings were taken in, so the conversion keeps
    # the wall-clock time each row already meant instead of silently relabelling
    # it as UTC.
    op.execute(
        "ALTER TABLE shipment "
        "ALTER COLUMN estimated_delivery TYPE TIMESTAMP WITH TIME ZONE "
        "USING estimated_delivery AT TIME ZONE current_setting('TimeZone')"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        "ALTER TABLE shipment "
        "ALTER COLUMN estimated_delivery TYPE TIMESTAMP WITHOUT TIME ZONE "
        "USING estimated_delivery AT TIME ZONE current_setting('TimeZone')"
    )
