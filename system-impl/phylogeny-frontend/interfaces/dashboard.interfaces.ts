import { MatrixRequestListItem } from './matrix-requests.interfaces';

export interface DashboardStats {
	totalMatrices: number;
	totalVisualizations: number;
	activeRequests: MatrixRequestListItem[];
	failedRequests: MatrixRequestListItem[];
}

export interface AdminDashboardStats {
	totalUsers: number;
	totalRoles: number;
	totalPermissions: number;
	totalMatrices: number;
	totalVisualizations: number;
	totalMatrixRequestsToday: number;
}
