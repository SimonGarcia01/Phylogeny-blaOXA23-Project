# services/minio.py

import os
import shutil
from pathlib import Path
from dataclasses import dataclass

from minio import Minio
from minio.error import S3Error

from app.core.config import settings


@dataclass
class DownloadResult:
    local_path: str
    object_key: str
    bucket: str


@dataclass
class UploadResult:
    object_key: str
    bucket: str
    size: int


class MinioService:
    def __init__(self) -> None:
        endpoint: str = (
            f'{settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", "")}:{settings.MINIO_PORT}'
        )
        self._client: Minio = Minio(
            endpoint=endpoint,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_ENDPOINT.startswith('https'),
        )
        self._matrix_bucket: str = settings.MINIO_MATRIX_BUCKET
        self._visualization_bucket: str = settings.MINIO_VISUALIZATION_BUCKET

    # -------------------------------------------------------------------------
    # Download
    # -------------------------------------------------------------------------

    def download_matrix(self, object_key: str, job_dir: str) -> DownloadResult:
        """
        Downloads a .nex file from the matrix bucket into a job-specific temp dir.
        Returns a DownloadResult with the local path where the file was saved.
        """
        filename: str = Path(object_key).name
        local_path: str = os.path.join(job_dir, filename)

        try:
            self._client.fget_object(
                bucket_name=self._matrix_bucket,
                object_name=object_key,
                file_path=local_path,
            )
        except S3Error as e:
            raise RuntimeError(f"Failed to download '{object_key}' from bucket '{self._matrix_bucket}': {e}")

        return DownloadResult(
            local_path=local_path,
            object_key=object_key,
            bucket=self._matrix_bucket,
        )

    # -------------------------------------------------------------------------
    # Upload
    # -------------------------------------------------------------------------

    def upload_result(self, local_path: str, object_key: str) -> UploadResult:
        """
        Uploads a single result file to the visualization bucket.
        Returns an UploadResult with the object key and file size.
        """
        file_size: int = os.path.getsize(local_path)

        try:
            self._client.fput_object(
                bucket_name=self._visualization_bucket,
                object_name=object_key,
                file_path=local_path,
            )
        except S3Error as e:
            raise RuntimeError(
                f"Failed to upload '{local_path}' as '{object_key}' to bucket '{self._visualization_bucket}': {e}"
            )

        return UploadResult(
            object_key=object_key,
            bucket=self._visualization_bucket,
            size=file_size,
        )

    def upload_job_results(
        self,
        job_dir: str,
        job_id: str,
        user_id: str,
        filenames: list[str],
    ) -> dict[str, UploadResult]:
        """
        Uploads multiple result files from the job dir to MinIO under
        results/{user_id}/{job_id}/{filename} and returns a dict mapping
        filename → UploadResult.
        """
        results: dict[str, UploadResult] = {}

        for filename in filenames:
            local_path: str = os.path.join(job_dir, filename)

            if not os.path.exists(local_path):
                raise FileNotFoundError(f"Expected result file not found: '{local_path}'")

            object_key: str = f'{user_id}/{job_id}/{filename}'
            results[filename] = self.upload_result(local_path, object_key)

        return results

    # -------------------------------------------------------------------------
    # Cleanup
    # -------------------------------------------------------------------------

    def cleanup_job_dir(self, job_dir: str) -> None:
        """
        Deletes the entire temporary job directory from the filesystem.
        Safe to call even if the directory doesn't exist.
        """
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir)

    # -------------------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------------------

    def build_job_dir(self, job_id: str) -> str:
        """
        Creates and returns a unique temp directory path for a job.
        The directory is created on disk immediately.
        """
        job_dir: str = os.path.join('/tmp', job_id)
        os.makedirs(job_dir, exist_ok=True)
        return job_dir
