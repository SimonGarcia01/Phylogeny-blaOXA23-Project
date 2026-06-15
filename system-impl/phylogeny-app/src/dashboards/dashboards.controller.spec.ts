import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { User } from 'src/auth/users/entities/user.entity';
import { RoleName } from 'src/auth/roles/entities/role.entity';

const mockDashboardsService = () => ({
    findUserStats: jest.fn(),
    findAdminStats: jest.fn(),
});

function buildUser(id = 1): User {
    return { id, email: 'u@test.com', role: { name: RoleName.RESEARCHER } } as unknown as User;
}

describe('DashboardsController', () => {
    let controller: DashboardsController;
    let service: ReturnType<typeof mockDashboardsService>;

    beforeEach(() => {
        service = mockDashboardsService();
        controller = new DashboardsController(service as unknown as DashboardsService);
    });

    it('findUserStats delegates to service with the current user', async () => {
        const stats = { totalMatrices: 5, totalVisualizations: 3, activeRequests: [], failedRequests: [] };
        service.findUserStats.mockResolvedValue(stats);
        const result = await controller.findUserStats(buildUser());
        expect(service.findUserStats).toHaveBeenCalledWith(buildUser());
        expect(result).toBe(stats);
    });

    it('findAdminStats delegates to service', async () => {
        const stats = { totalUsers: 10, totalRoles: 2, totalPermissions: 28, totalMatrices: 100, totalVisualizations: 80, totalMatrixRequestsToday: 5 };
        service.findAdminStats.mockResolvedValue(stats);
        const result = await controller.findAdminStats();
        expect(service.findAdminStats).toHaveBeenCalled();
        expect(result).toBe(stats);
    });
});
