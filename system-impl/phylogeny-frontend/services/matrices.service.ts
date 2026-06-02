import { MatrixListItem } from '@/interfaces/matrices.interfaces';
import apiClient from './api-client.service';

const matricesService = {
	async getAll(): Promise<MatrixListItem[]> {
		return apiClient.get<MatrixListItem[]>('/matrices/count');
	},
};

export default matricesService;
