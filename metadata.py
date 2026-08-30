from src.e_sus.core.database import Base
from src.e_sus.modules.users.models import Base

print(Base.metadata.tables.keys())