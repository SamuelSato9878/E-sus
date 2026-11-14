from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from e_sus.core.config import settings

from e_sus.modules.auth.router import auth_router
from e_sus.modules.users.routes import users_router
from e_sus.modules.patients.routes import patients_router
from e_sus.modules.professional.routes import professionals_router
from e_sus.modules.specialties.routes import specialties_router
from e_sus.modules.services.routes import services_router
from e_sus.modules.schedules.routes import schedules_router
from e_sus.modules.appointments.routes import appointments_router
from e_sus.modules.notificatons.routes import notifications_router


app = FastAPI()

cors_origins = settings.ALLOWED_ORIGINS
print(cors_origins)

"""@app.middleware("http")
async def log_request_origin(request, call_next):
    print("METHOD:", request.method)
    print("ORIGIN:", request.headers.get("origin"))
    print(
        "REQUEST METHOD:",
        request.headers.get("access-control-request-method")
    )
    print(
        "REQUEST HEADERS:",
        request.headers.get("access-control-request-headers")
    )

    response = await call_next(request)
    return response"""

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(patients_router)
app.include_router(professionals_router)
app.include_router(specialties_router)
app.include_router(services_router)
app.include_router(schedules_router)
app.include_router(appointments_router)
app.include_router(notifications_router)

@app.get("/")
def root():
    return {
        "message": "e-SUS API"
    }
