
#users_router = APIRouter(prefix="/users", tags=["users"])

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.modules.users.schemas import (
    AdminUserCreate,
    UserCreate,
    UserUpdate,
    UserResponse
)
from e_sus.modules.users.service import UserService
from e_sus.modules.auth.dependencies import require_admin


users_router = APIRouter(
    prefix="/users",
    tags=["Users"]
)
@users_router.post(
    "/admins",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_admin(
    data: AdminUserCreate,
    _admin=Depends(require_admin),
    db: Session=Depends(get_db),
):
    try:
        return UserService(db).create_admin(data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error


@users_router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    data: UserCreate,
    _admin = Depends(require_admin),
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
    _admin = Depends(require_admin),
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
    _admin = Depends(require_admin),
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
    _admin = Depends(require_admin),
    db: Session = Depends(get_db)
):

    service = UserService(db)

    try:
        return service.update(
            user_id,
            data
        )

    except ValueError as error:
        status_code = status.HTTP_404_NOT_FOUND if str(error) == "Usuário não encontrado." else status.HTTP_400_BAD_REQUEST
        raise HTTPException(
            status_code=status_code,
            detail=str(error)
        )


@users_router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_user(
    user_id: int,
    _admin = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Response:

    service = UserService(db)

    try:
        service.delete(user_id)

        return Response(status_code=status.HTTP_204_NO_CONTENT)

    except ValueError as error:
        code = status.HTTP_404_NOT_FOUND if str(error) == "Usuário não encontrado." else status.HTTP_409_CONFLICT
        raise HTTPException(
            status_code=code,
            detail=str(error)
        )
