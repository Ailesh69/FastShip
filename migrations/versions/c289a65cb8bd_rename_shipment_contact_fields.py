"""rename shipment contact fields

Revision ID: c289a65cb8bd
Revises: 1a5ca1072361
Create Date: 2026-07-31 20:26:14.265614

"""
from typing import Sequence, Union
import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c289a65cb8bd'
down_revision: Union[str, Sequence[str], None] = '1a5ca1072361'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    op.alter_column('shipment', 'client_Email', new_column_name='client_contact_email')
    op.alter_column('shipment', 'client_contact_number',
                     new_column_name='client_contact_phone', type_=sa.String())

def downgrade():
    op.alter_column('shipment', 'client_contact_phone',
                     new_column_name='client_contact_number', type_=sa.BigInteger())
    op.alter_column('shipment', 'client_contact_email', new_column_name='client_Email')