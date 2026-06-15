import { MatrixRequestListItem } from '@/interfaces/matrix-requests.interfaces';
import apiClient from './api-client.service';

const matrixRequestsService = {
	async getAll(): Promise<MatrixRequestListItem[]> {
		return apiClient.get<MatrixRequestListItem[]>('/matrix-requests');
	},
};

export default matrixRequestsService;
