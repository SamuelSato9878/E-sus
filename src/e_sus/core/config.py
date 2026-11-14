from typing import Annotated
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict, NoDecode

from pathlib import Path

print("Diretório atual:", Path.cwd())
print("Arquivo .env:", Path(".env").resolve())
print("Existe .env:", Path(".env").exists())



class Settings(BaseSettings):
    API_PREFIX: str = "/api"
    DEBUG: bool = False

    DATABASE_URL: str = ""

    ALLOWED_ORIGINS: Annotated[list[str], NoDecode] = []

    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_PASSWORD_RESET_REDIRECT_TO: str = "esus://esqueci-senha"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value):
        if isinstance(value, str):
            return [
                origin.strip()
                for origin in value.split(",")
                if origin.strip()
            ]

        return value or []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

print("ORIGENS CARREGADAS:", settings.ALLOWED_ORIGINS)