from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "API for Phylogeny Analysis"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Default Description"
    HOST: str = "localhost"
    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000"


    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings: Settings = Settings()