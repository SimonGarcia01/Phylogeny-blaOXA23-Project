from pydantic import BaseModel


class MatrixAnalysisRequest(BaseModel):
    matrix_object_key: str
    matrix_request_id: str
    bucket_name: str


class MatrixAnalysisResponse(BaseModel):
    message: str
