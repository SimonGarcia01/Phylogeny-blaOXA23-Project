from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = 'API for Phylogeny Analysis'
    VERSION: str = '1.0.0'
    DESCRIPTION: str = 'Default Description'
    HOST: str = 'localhost'
    PORT: int = 8000
    CORS_ORIGINS: str = 'http://localhost:3000'
    MINIO_ENDPOINT: str = 'http://localhost'
    MINIO_PORT: int = 9000
    MINIO_MATRIX_BUCKET: str = 'matrix'
    MINIO_VISUALIZATION_BUCKET: str = 'visualization'
    MINIO_ACCESS_KEY: str = 'minio'
    MINIO_SECRET_KEY: str = 'minio123'
    INTERNAL_SECRET: str = 'supersecretkey'
    NEST_API_URL: str = 'http://localhost:3000'

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')


settings: Settings = Settings()
