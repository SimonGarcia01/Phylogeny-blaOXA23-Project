from app.schemas.camel_model import CamelModel


class MatrixAnalysisRequest(CamelModel):
    matrix_object_key: str
    visualization_object_key: str
    visualization_id: str
    matrix_request_id: int


class MatrixAnalysisResponse(CamelModel):
    task_id: str
