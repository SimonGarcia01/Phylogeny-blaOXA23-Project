import {
	CreateMatrixRequest,
	GenerateUploadUrlRequest,
	GenerateUploadUrlResponse,
	MatrixDetail,
	MatrixListItem,
	UpdateMatrixRequest,
} from '@/interfaces/matrices.interfaces';
import apiClient from './api-client.service';

const matricesService = {
	async getAll(): Promise<MatrixListItem[]> {
		return apiClient.get<MatrixListItem[]>('/matrices');
	},

	async getOne(id: string): Promise<MatrixDetail> {
		return apiClient.get<MatrixDetail>(`/matrices/${id}`);
	},

	async generateUploadUrl(dto: GenerateUploadUrlRequest): Promise<GenerateUploadUrlResponse> {
		return apiClient.post<GenerateUploadUrlResponse, GenerateUploadUrlRequest>(
			'/matrices/get-matrix-upload-url',
			dto,
		);
	},

	async uploadToMinio(uploadUrl: string, file: File): Promise<void> {
		const browserUrl = uploadUrl.replace(/^https?:\/\/minio:\d+/, 'http://localhost:9000');
		const response = await fetch(browserUrl, {
			method: 'PUT',
			body: file,
			// No Content-Type header — the presigned URL is signed for host only;
			// adding extra headers breaks the AWS signature (causes 403).
		});
		if (!response.ok) {
			throw new Error(`MinIO upload failed: ${response.status} ${response.statusText}`);
		}
	},

	async create(dto: CreateMatrixRequest): Promise<{ message: string }> {
		return apiClient.post<{ message: string }, CreateMatrixRequest>('/matrices', dto);
	},

	async update(id: string, dto: UpdateMatrixRequest): Promise<{ message: string }> {
		return apiClient.patch<{ message: string }, UpdateMatrixRequest>(`/matrices/${id}`, dto);
	},

	async remove(id: string): Promise<{ message: string }> {
		return apiClient.delete<{ message: string }>(`/matrices/${id}`);
	},
};

export default matricesService;
