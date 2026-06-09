from fastapi import APIRouter

from app.models.matrix_analysis import MatrixAnalysisRequest, MatrixAnalysisResponse

router: APIRouter = APIRouter(
    prefix="/analysis",
    tags=["matrix analysis"]
)

@router.post("/analyze_matrix", response_model=MatrixAnalysisResponse)
async def analyze_matrix(matrixRequest: MatrixAnalysisRequest) -> MatrixAnalysisResponse:

    return MatrixAnalysisResponse(message=f"Matrix analysis request received for object key: {matrixRequest.matrix_object_key} with request ID: {matrixRequest.matrix_request_id}")

    
    