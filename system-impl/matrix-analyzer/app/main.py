from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import analysis

#Create the FastAPI instance with a title
app: FastAPI = FastAPI(
    title=settings.APP_NAME
)

#Give access to the analysis router
app.include_router(analysis.router)

#Configure CORS so requests can be made from different origins
origins: list[str] = settings.CORS_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)