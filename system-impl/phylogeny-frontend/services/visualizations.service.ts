import {
	AnalyzeMatrixRequest,
	AnalyzeResponse,
	UpdateVisualizationRequest,
	VisualizationDetail,
	VisualizationListItem,
} from '@/interfaces/visualizations.interfaces';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from './api-client.service';

const visualizationsService = {
	async getAll(): Promise<VisualizationListItem[]> {
		return apiClient.get<VisualizationListItem[]>('/visualizations');
	},

	async getOne(id: string): Promise<VisualizationDetail> {
		return apiClient.get<VisualizationDetail>(`/visualizations/${id}`);
	},

	async analyze(dto: AnalyzeMatrixRequest): Promise<AnalyzeResponse> {
		return apiClient.post<AnalyzeResponse, AnalyzeMatrixRequest>('/visualizations/analyze', dto);
	},

	async update(id: string, dto: UpdateVisualizationRequest): Promise<{ message: string }> {
		return apiClient.patch<{ message: string }, UpdateVisualizationRequest>(
			`/visualizations/${id}`,
			dto,
		);
	},

	async getTree(id: string): Promise<string> {
		// Goes through the Next.js API route so the server fetches from minio:9000 (internal Docker URL)
		const token = useAuthStore.getState().token;
		const response = await fetch(`/api/visualizations/${id}/tree`, {
			headers: { Authorization: `Bearer ${token ?? ''}` },
		});
		if (!response.ok) {
			const data = await response.json().catch(() => null);
			const msg = data?.message ?? `Failed to load tree: ${response.status}`;
			throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
		}
		return response.text();
	},

	async remove(id: string): Promise<{ message: string }> {
		return apiClient.delete<{ message: string }>(`/visualizations/${id}`);
	},
};

export default visualizationsService;
