#from pydantic import BaseModel, EmailStr, Field

""" class UserCreate():
    name: str
    email: EmailStr
    phone: str = Field(
        pattern=r"^\d{2}9\d{8}$", 
        description="Telefone deve ter o formato DDD + 9 + 8 dígitos (apenas números)"
    )
    
 """
 
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }