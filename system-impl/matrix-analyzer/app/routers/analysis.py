from fastapi import APIRouter, Depends
from app.dependencies.internal_auth import verify_internal_secret
from app.models.matrix_analysis import MatrixAnalysisRequest, MatrixAnalysisResponse

router: APIRouter = APIRouter(prefix='/analysis', tags=['matrix analysis'], dependencies=[Depends(verify_internal_secret)])


@router.post('/analyze_matrix', response_model=MatrixAnalysisResponse)
async def analyze_matrix(matrixRequest: MatrixAnalysisRequest) -> MatrixAnalysisResponse:

    return MatrixAnalysisResponse(
        task_id=f'Matrix analysis request received for object key: {matrixRequest.matrix_object_key} with request ID: {matrixRequest.matrix_request_id}'
    )
