import os

from app.schemas.analysis import MatrixAnalysisRequest
from app.services.api_client import NestApiClient
from app.services.jmodeltest import JModelTestResult, run_jmodeltest, select_criterion
from app.services.minio import MinioService, DownloadResult, UploadResult
from app.services.alignment import convert_to_phylip, get_num_taxa
from app.services.raxml import RAxMLResult, run_raxml


def run_phylo_pipeline(
    request: MatrixAnalysisRequest,
    minio: MinioService,
    nest: NestApiClient,
):

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
            print("[pipeline] Size of the downloaded file :", os.path.getsize(download.local_path), " bytes")
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
            
        except Exception as e:
            nest.mark_failed(request.matrix_request_id, f'JModelTest2 failed: {e}')
            raise

        # Step 5: Run RAxML-NG with the best model to build the phylogenetic tree
        try:
            raxml_result: RAxMLResult = run_raxml(
                phy_path=phy_path,
                job_dir=job_dir,
                best_model=jmodel_result.best_model,
                prefix='tree',
            )
            print(f'[pipeline] RAxML-NG finished. Support tree: {raxml_result.support_path}')
        except Exception as e:
            nest.mark_failed(request.matrix_request_id, f'RAxML-NG failed: {e}')
            raise

        # Step 6: Upload the support tree (.raxml.support) to MinIO at the visualization object key
        try:
            upload: UploadResult = minio.upload_result(
                local_path=raxml_result.support_path,
                object_key=request.visualization_object_key,
            )
            print(f'[pipeline] Uploaded support tree to MinIO: {upload.object_key} ({upload.size} bytes)')
        except Exception as e:
            nest.mark_failed(request.matrix_request_id, f'Failed to upload tree to MinIO: {e}')
            raise

        # Step 7: Finalize the visualization in NestJS with the actual file size and MIME type
        nest.finalize_visualization(
            request.visualization_id,
            file_size=upload.size,
            mime_type='text/plain',
        )
        nest.mark_completed(request.matrix_request_id)

    finally:
        minio.cleanup_job_dir(job_dir)
