from app.celery_app import celery_app
from app.pipeline.phylo_pipeline import run_phylo_pipeline
from app.schemas.analysis import MatrixAnalysisRequest
from app.services.api_client import get_nest_client
from app.services.minio import get_minio_service


@celery_app.task(name='phylo.run_analysis')
def run_analysis_task(request_data: dict) -> None:
    request = MatrixAnalysisRequest(**request_data)
    run_phylo_pipeline(request, get_minio_service(), get_nest_client())
