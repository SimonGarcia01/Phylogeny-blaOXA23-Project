from celery import Celery # type: ignore
from app.core.config import settings

celery_app = Celery(
    'matrix-analyzer',
    broker=settings.REDIS_URL,
    include=['app.tasks.phylo_task'],
)

celery_app.conf.update( # type: ignore
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
)
