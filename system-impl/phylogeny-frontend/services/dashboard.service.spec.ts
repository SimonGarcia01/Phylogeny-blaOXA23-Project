jest.mock('./api-client.service', () => ({
	__esModule: true,
	default: { get: jest.fn() },
}));

import apiClient from './api-client.service';
import dashboardService from './dashboard.service';

beforeEach(() => jest.clearAllMocks());

describe('dashboardService.getMyDashboard', () => {
	it('GETs /dashboards/my and returns stats', async () => {
		const stats = { matricesCount: 3, visualizationsCount: 1 };
		(apiClient.get as jest.Mock).mockResolvedValue(stats);
		const result = await dashboardService.getMyDashboard();
		expect(apiClient.get).toHaveBeenCalledWith('/dashboards/my');
		expect(result).toEqual(stats);
	});
});

describe('dashboardService.getAdminDashboard', () => {
	it('GETs /dashboards/admin and returns admin stats', async () => {
		const stats = { totalUsers: 10, totalMatrices: 20 };
		(apiClient.get as jest.Mock).mockResolvedValue(stats);
		const result = await dashboardService.getAdminDashboard();
		expect(apiClient.get).toHaveBeenCalledWith('/dashboards/admin');
		expect(result).toEqual(stats);
	});
});
