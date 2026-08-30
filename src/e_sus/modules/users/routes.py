from fastapi import APIRouter
from fastapi.responses import JSONResponse

users_router = APIRouter(prefix="/users", tags=["users"])

@users_router.get("/HelloWorld")
async def say_hello():
    return {"Hello": "World"}


@users_router.get("/MeuChapa")
async def say_meu_chapa():
    return {"oi": "meu chapa"}
