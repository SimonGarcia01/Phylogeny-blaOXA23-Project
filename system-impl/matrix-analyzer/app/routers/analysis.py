from fastapi import APIRouter, Request

from app.models.matrix_analysis import MatrixAnalysisRequest, MatrixAnalysisResponse

router: APIRouter = APIRouter(prefix='/analysis', tags=['matrix analysis'])


@router.post('/analyze_matrix', response_model=MatrixAnalysisResponse)
async def analyze_matrix(request: Request, matrixRequest: MatrixAnalysisRequest) -> MatrixAnalysisResponse:
    body = await request.json()
    print(f"Raw body: {body}")           # ← see exactly what arrived
    print(f"Parsed: {matrixRequest}")

    return MatrixAnalysisResponse(
        task_id=f'Matrix analysis request received for object key: {matrixRequest.matrix_object_key} with request ID: {matrixRequest.matrix_request_id}'
    )
