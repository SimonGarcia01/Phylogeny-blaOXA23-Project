import { AdminDashboardStats, DashboardStats } from '@/interfaces/dashboard.interfaces';
import apiClient from './api-client.service';

const dashboardService = {
	async getMyDashboard(): Promise<DashboardStats> {
		return apiClient.get<DashboardStats>('/dashboards/my');
	},

	async getAdminDashboard(): Promise<AdminDashboardStats> {
		return apiClient.get<AdminDashboardStats>('/dashboards/admin');
	},
};

export default dashboardService;
