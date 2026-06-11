import httpx
from enum import Enum

from core.config import settings


class MatrixRequestStatus(str, Enum):
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'


class NestApiClient:
    """
    HTTP client for calling back to the NestJS backend.
    All methods are synchronous since they will be called from the pipeline.
    """

    def __init__(self) -> None:
        self._base_url: str = settings.NEST_API_URL
        self._headers: dict[str, str] = {
            'Content-Type': 'application/json',
            'x-internal-secret': settings.INTERNAL_SECRET,
        }

    def update_status(
        self,
        matrix_request_id: int,
        status: MatrixRequestStatus,
        error: str | None = None,
    ) -> None:
        """
        Updates the status of a MatrixRequest in the NestJS backend.
        Silently logs on failure — a status update should never crash the pipeline.
        """
        url: str = f'{self._base_url}/matrix-requests/{matrix_request_id}/status'

        payload: dict[str, object] = {'status': status.value}
        if error:
            payload['error'] = error

        try:
            response: httpx.Response = httpx.patch(url, json=payload, headers=self._headers, timeout=10)
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            print(f'[api_client] Status update failed — HTTP {e.response.status_code}: {e.response.text}')
        except httpx.RequestError as e:
            print(f'[api_client] Status update failed — could not reach NestJS: {e}')

    # Wrappers for common status updates
    def mark_failed(self, matrix_request_id: int, error: str) -> None:
        self.update_status(matrix_request_id, MatrixRequestStatus.FAILED, error=error)

    def mark_completed(self, matrix_request_id: int) -> None:
        self.update_status(matrix_request_id, MatrixRequestStatus.COMPLETED)

    def mark_processing(self, matrix_request_id: int) -> None:
        self.update_status(matrix_request_id, MatrixRequestStatus.PROCESSING)


# Make a singleton instance of the NestApiClient awailable for import across the app
_nest_client: NestApiClient | None = None


def get_nest_client() -> NestApiClient:
    global _nest_client
    if _nest_client is None:
        _nest_client = NestApiClient()
    return _nest_client
