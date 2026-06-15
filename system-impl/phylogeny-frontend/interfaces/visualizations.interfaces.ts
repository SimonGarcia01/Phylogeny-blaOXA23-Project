export interface VisualizationListItem {
	visualizationId: string;
	name?: string;
	createdAt?: string;
	fileSize?: number;
}

export interface VisualizationDetail {
	visualizationId: string;
	name?: string;
	description?: string;
	createdAt?: string;
	fileSize?: number;
	relatedMatrixId?: string;
}

export interface UpdateVisualizationRequest {
	name?: string;
	description?: string;
}

export interface AnalyzeMatrixRequest {
	matrixId: string;
}

export interface AnalyzeResponse {
	matrixRequestId: number;
	visualizationId: string;
	status: string;
}
