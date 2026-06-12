from app.schemas.analysis import MatrixAnalysisRequest
from app.services.api_client import NestApiClient
from app.services.jmodeltest import select_criterion
from services.minio import MinioService, DownloadResult
from services.alignment import convert_to_phylip, get_num_taxa


def run_phylo_pipeline(
    request: MatrixAnalysisRequest,
    minio: MinioService,
    nest: NestApiClient,
) -> str:
    
    #As soon as pipeline starts running, mark the request as processing in Nest backend
    nest.mark_processing(request.matrix_request_id)

    #Build the temporary job directory path using the visualization ID
    job_dir: str = minio.build_job_dir(request.visualization_id)

    try:
        # Step 1: Download the .nex file from MinIO into the job-specific temp dir
        try:
            download: DownloadResult = minio.download_matrix(
                object_key=request.matrix_object_key,
                job_dir=job_dir,
            )
            print(f'[pipeline] Downloaded to: {download.local_path}')
        except Exception as e:
            nest.mark_failed(request.matrix_request_id, f'Failed to download matrix file: {e}')
            raise

        # Step 2: Convert .nex → .phy and save in the same job dir
        try:
            phy_path: str = convert_to_phylip(download.local_path, job_dir)
            print(f'[pipeline] Converted to PHYLIP: {phy_path}')
        except Exception as e:
            nest.mark_failed(request.matrix_request_id, f'Failed to parse alignment file: {e}')
            raise

        #Step 3: Determine the best model selection criterion based on number of taxa
        num_taxa: int = get_num_taxa(phy_path)
        criterion: str = select_criterion(num_taxa)

        # Step 4: JModelTest2 model selection
        # Step 4: RAxML-NG  making the tree using the best model from JModelTest2
        # Step 5: Upload results to MinIO
        # Step 6: Update Nest backend with completion status and the visualization details

        nest.mark_completed(request.matrix_request_id)
        return 'pipeline_placeholder'

    finally:
        minio.cleanup_job_dir(job_dir)