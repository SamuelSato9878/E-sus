
#users_router = APIRouter(prefix="/users", tags=["users"])

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.modules.users.schemas import (
    UserCreate,
    UserUpdate,
    UserResponse
)
from e_sus.modules.users.service import UserService


users_router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@users_router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db)
):

    service = UserService(db)

    try:
        return service.create(data)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@users_router.get(
    "/",
    response_model=list[UserResponse]
)
def get_users(
    db: Session = Depends(get_db)
):

    service = UserService(db)

    return service.get_all()


@users_router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    service = UserService(db)

    try:
        return service.get_by_id(user_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )


@users_router.put(
    "/{user_id}",
    response_model=UserResponse
)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db)
):

    service = UserService(db)

    try:
        return service.update(
            user_id,
            data
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@users_router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    service = UserService(db)

    try:
        service.delete(user_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )