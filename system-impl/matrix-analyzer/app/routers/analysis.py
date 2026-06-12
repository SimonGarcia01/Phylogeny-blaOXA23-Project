import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends
from app.dependencies.internal_auth import verify_internal_secret
from app.pipeline.phylo_pipeline import run_phylo_pipeline
from app.schemas.analysis import MatrixAnalysisRequest, MatrixAnalysisResponse
from app.services.api_client import NestApiClient, get_nest_client
from app.services.minio import MinioService, get_minio_service

router: APIRouter = APIRouter(
    prefix='/analysis', tags=['matrix analysis'], dependencies=[Depends(verify_internal_secret)]
)


@router.post('/analyze_matrix', response_model=MatrixAnalysisResponse, response_model_by_alias=True)
async def analyze_matrix(
    matrixRequest: MatrixAnalysisRequest,
    background_tasks: BackgroundTasks,
    minio: MinioService = Depends(get_minio_service),
    nest: NestApiClient = Depends(get_nest_client),
) -> MatrixAnalysisResponse:

    background_tasks.add_task(
        asyncio.get_event_loop().run_in_executor,
        None,                           # uses default ThreadPoolExecutor
        run_phylo_pipeline,
        matrixRequest,
        minio,
        nest,
    )

    return MatrixAnalysisResponse(task_id=f'queued:{matrixRequest.visualization_id}')
