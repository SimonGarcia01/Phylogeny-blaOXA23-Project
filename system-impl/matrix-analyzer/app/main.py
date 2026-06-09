from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app: FastAPI = FastAPI(
    title=settings.APP_NAME
)

origins: list[str] = settings.CORS_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "hello"}