import os

from app.schemas.analysis import MatrixAnalysisRequest
from app.services.api_client import NestApiClient
from app.services.jmodeltest import JModelTestResult, run_jmodeltest, select_criterion
from app.services.minio import MinioService, DownloadResult
from app.services.alignment import convert_to_phylip, get_num_taxa


def run_phylo_pipeline(
    request: MatrixAnalysisRequest,
    minio: MinioService,
    nest: NestApiClient,
) -> str:

    # As soon as pipeline starts running, mark the request as processing in Nest backend
    nest.mark_processing(request.matrix_request_id)

    # Build the temporary job directory path using the visualization ID
    job_dir: str = minio.build_job_dir(request.visualization_id)

    try:
        # Step 1: Download the .nex file from MinIO into the job-specific temp dir
        try:
            download: DownloadResult = minio.download_matrix(
                object_key=request.matrix_object_key,
                job_dir=job_dir,
            )
            print(f'[pipeline] Downloaded to: {download.local_path}')
            print("[pipeline] Size of the downloaded file :", os.path.getsize(download.local_path))
            with open(download.local_path, "r", encoding="utf-8", errors="ignore") as f:
                print(f.read(500))
        except Exception as e:
            nest.mark_failed(request.matrix_request_id, f'Failed to download matrix file: {e}')
            raise

        # Step 2: Convert .nex --> .phy and save in the same job dir
        try:
            phy_path: str = convert_to_phylip(download.local_path, job_dir)
            print(f'[pipeline] Converted to PHYLIP: {phy_path}')
        except Exception as e:
            nest.mark_failed(request.matrix_request_id, f'Failed to parse alignment file: {e}')
            raise

        # Step 3: Determine the best model selection criterion based on number of taxa
        num_taxa: int = get_num_taxa(phy_path)
        criterion: str = select_criterion(num_taxa)
        print(f'[pipeline] {num_taxa} taxa detected — using {criterion}')

        # Step 4: run JModelTest2 model selection
        try:
            jmodel_result: JModelTestResult = run_jmodeltest(phy_path, job_dir, criterion)
            print(f'[pipeline] Raw best model string length: {len(jmodel_result.best_model)}')
            print(f'[pipeline] Best model: {jmodel_result.best_model} (by {criterion})')
            
            with open(jmodel_result.raw_output_path, 'r') as f:
                for line in f:
                    if 'model' in line.lower() and not line.strip().startswith('('):
                        print(f'[jmodel output] {line.rstrip()}')
        except Exception as e:
            nest.mark_failed(request.matrix_request_id, f'JModelTest2 failed: {e}')
            raise

        # Step 5: RAxML-NG  making the tree using the best model from JModelTest2
        # Step 6: Upload results to MinIO
        # Step 7: Finalize the visualization in nest -> add the mime type and file size of the tree file
        nest.mark_completed(request.matrix_request_id)
        return jmodel_result.best_model

    finally:
        minio.cleanup_job_dir(job_dir)
