"""unique email on seller and delivery_partner

Revision ID: ac2308c0e99c
Revises: 133b57ce6201
Create Date: 2026-08-09 19:24:35.599891

"""
from typing import Sequence, Union
import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac2308c0e99c'
down_revision: Union[str, Sequence[str], None] = '133b57ce6201'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Both tables allowed the same email on any number of rows. Login resolves
    # an account with a plain SELECT ... WHERE email = :e and takes the first
    # row, so duplicates meant a user could not tell which account they were
    # signing into. Fails loudly if duplicates already exist — deduplicate
    # first, they cannot be resolved automatically.
    op.create_index("ix_seller_email", "seller", ["email"], unique=True)
    op.create_index(
        "ix_delivery_partner_email", "delivery_partner", ["email"], unique=True
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_delivery_partner_email", table_name="delivery_partner")
    op.drop_index("ix_seller_email", table_name="seller")
