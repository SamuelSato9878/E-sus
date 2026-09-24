from sqlalchemy import select
from sqlalchemy.orm import Session

from e_sus.modules.users.models import User

class AuthRepository():
    def __init__(self, db: Session):
        self.db = db
        
    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user
    
    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(
            User.email == email
        )
    
        return self.db.scalar(statement)
    
    def get_by_supabase_user_id(self, supabase_user_id: str) -> User | None:
        statement = select(User).where(
            User.supabase_user_id == supabase_user_id
        )
        
        return self.db.scalar(statement)
    
