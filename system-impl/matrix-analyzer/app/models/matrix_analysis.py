from pydantic import BaseModel


class MatrixAnalysisRequest(BaseModel):
    matrixObjectKey: str
    visualizationObjectKey: str
    visualizationId: str
    matrixRequestId: str


class MatrixAnalysisResponse(BaseModel):
    message: str
