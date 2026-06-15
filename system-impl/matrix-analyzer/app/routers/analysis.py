from typing import Any, cast

from fastapi import APIRouter, Depends
from app.dependencies.internal_auth import verify_internal_secret
from app.schemas.analysis import MatrixAnalysisRequest, MatrixAnalysisResponse
from app.tasks.phylo_task import run_analysis_task

router: APIRouter = APIRouter(
    prefix='/analysis', tags=['matrix analysis'], dependencies=[Depends(verify_internal_secret)]
)


@router.post('/analyze_matrix', response_model=MatrixAnalysisResponse, response_model_by_alias=True)
async def analyze_matrix(
    matrixRequest: MatrixAnalysisRequest,
) -> MatrixAnalysisResponse:
    cast(Any, run_analysis_task).delay(matrixRequest.model_dump())
    return MatrixAnalysisResponse(task_id=f'queued:{matrixRequest.visualization_id}')
