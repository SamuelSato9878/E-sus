from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from e_sus.core.config import settings

from e_sus.modules.auth.router import auth_router
from e_sus.modules.users.routes import users_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)

@app.get("/")
def root():
    return {
        "message": "e-SUS API"
    }
