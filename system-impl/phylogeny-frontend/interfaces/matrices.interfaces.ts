export interface MatrixListItem {
	matrixId: string;
	name?: string;
	uploadedAt?: string;
}

export interface MatrixDetail {
	matrixId: string;
	name?: string;
	description?: string;
	uploadedAt?: string;
	fileSize?: number;
	relatedVisualizationId?: string;
}

export interface GenerateUploadUrlRequest {
	fileName: string;
	fileSize: number;
	fileType: string;
}

export interface GenerateUploadUrlResponse {
	matrixId: string;
	objectKey: string;
	uploadUrl: string;
}

export interface CreateMatrixRequest {
	matrixId: string;
	name: string;
	objectKey: string;
	description?: string;
	mimeType: string;
	fileSize: number;
}

export interface UpdateMatrixRequest {
	name?: string;
	description?: string;
}
