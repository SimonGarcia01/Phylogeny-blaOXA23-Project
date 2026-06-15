import { DashboardsService } from './dashboards.service';
import { UsersService } from 'src/auth/users/users.service';
import { RolesService } from 'src/auth/roles/roles.service';
import { PermissionsService } from 'src/auth/permissions/permissions.service';
import { MatricesService } from 'src/matrices/matrices.service';
import { VisualizationsService } from 'src/visualizations/visualizations.service';
import { MatrixRequestsService } from 'src/matrix-requests/matrix-requests.service';
import { User } from 'src/auth/users/entities/user.entity';
import { RoleName } from 'src/auth/roles/entities/role.entity';
import { MatrixRequestStatus } from 'src/matrix-requests/entities/matrix-request.entity';

const mockUsersService = () => ({ count: jest.fn() });
const mockRolesService = () => ({ count: jest.fn() });
const mockPermissionsService = () => ({ count: jest.fn() });
const mockMatricesService = () => ({ countByUser: jest.fn(), countAll: jest.fn() });
const mockVisualizationsService = () => ({ countByUser: jest.fn(), countAll: jest.fn() });
const mockMatrixRequestsService = () => ({
    findActiveByUser: jest.fn(),
    findFailedByUser: jest.fn(),
    countToday: jest.fn(),
});

function buildUser(id = 1): User {
    return { id, email: 'u@test.com', role: { name: RoleName.RESEARCHER } } as unknown as User;
}

function buildRequest(status: MatrixRequestStatus) {
    return { id: 1, name: 'req', requestedAt: new Date(), status, finishedAt: undefined };
}

describe('DashboardsService', () => {
    let service: DashboardsService;
    let usersService: ReturnType<typeof mockUsersService>;
    let rolesService: ReturnType<typeof mockRolesService>;
    let permissionsService: ReturnType<typeof mockPermissionsService>;
    let matricesService: ReturnType<typeof mockMatricesService>;
    let visualizationsService: ReturnType<typeof mockVisualizationsService>;
    let matrixRequestsService: ReturnType<typeof mockMatrixRequestsService>;

    beforeEach(() => {
        usersService = mockUsersService();
        rolesService = mockRolesService();
        permissionsService = mockPermissionsService();
        matricesService = mockMatricesService();
        visualizationsService = mockVisualizationsService();
        matrixRequestsService = mockMatrixRequestsService();

        service = new DashboardsService(
            usersService as unknown as UsersService,
            rolesService as unknown as RolesService,
            permissionsService as unknown as PermissionsService,
            matricesService as unknown as MatricesService,
            visualizationsService as unknown as VisualizationsService,
            matrixRequestsService as unknown as MatrixRequestsService,
        );
    });

    describe('findUserStats', () => {
        it('aggregates matrix count, visualization count, active and failed requests for the user', async () => {
            matricesService.countByUser.mockResolvedValue(5);
            visualizationsService.countByUser.mockResolvedValue(3);
            matrixRequestsService.findActiveByUser.mockResolvedValue([buildRequest(MatrixRequestStatus.PENDING)]);
            matrixRequestsService.findFailedByUser.mockResolvedValue([buildRequest(MatrixRequestStatus.FAILED)]);

            const result = await service.findUserStats(buildUser());

            expect(result.totalMatrices).toBe(5);
            expect(result.totalVisualizations).toBe(3);
            expect(result.activeRequests).toHaveLength(1);
            expect(result.failedRequests).toHaveLength(1);
        });

        it('runs all four queries in parallel (all four mock callCounts are 1)', async () => {
            matricesService.countByUser.mockResolvedValue(0);
            visualizationsService.countByUser.mockResolvedValue(0);
            matrixRequestsService.findActiveByUser.mockResolvedValue([]);
            matrixRequestsService.findFailedByUser.mockResolvedValue([]);

            await service.findUserStats(buildUser());

            expect(matricesService.countByUser).toHaveBeenCalledTimes(1);
            expect(visualizationsService.countByUser).toHaveBeenCalledTimes(1);
            expect(matrixRequestsService.findActiveByUser).toHaveBeenCalledTimes(1);
            expect(matrixRequestsService.findFailedByUser).toHaveBeenCalledTimes(1);
        });
    });

    describe('findAdminStats', () => {
        it('aggregates global counts across all entities', async () => {
            usersService.count.mockResolvedValue(10);
            rolesService.count.mockResolvedValue(2);
            permissionsService.count.mockResolvedValue(28);
            matricesService.countAll.mockResolvedValue(100);
            visualizationsService.countAll.mockResolvedValue(80);
            matrixRequestsService.countToday.mockResolvedValue(5);

            const result = await service.findAdminStats();

            expect(result.totalUsers).toBe(10);
            expect(result.totalRoles).toBe(2);
            expect(result.totalPermissions).toBe(28);
            expect(result.totalMatrices).toBe(100);
            expect(result.totalVisualizations).toBe(80);
            expect(result.totalMatrixRequestsToday).toBe(5);
        });
    });
});
