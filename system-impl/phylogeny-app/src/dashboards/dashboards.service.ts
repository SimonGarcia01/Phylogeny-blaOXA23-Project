import { Injectable } from '@nestjs/common';

import { User } from 'src/auth/users/entities/user.entity';
import { UsersService } from 'src/auth/users/users.service';
import { RolesService } from 'src/auth/roles/roles.service';
import { PermissionsService } from 'src/auth/permissions/permissions.service';
import { MatricesService } from 'src/matrices/matrices.service';
import { VisualizationsService } from 'src/visualizations/visualizations.service';
import { MatrixRequestsService } from 'src/matrix-requests/matrix-requests.service';
import { MatrixRequestListItemDto } from 'src/matrix-requests/dto/response-m-r-list-item.dto';

import { ResponseDashboardDto } from './dto/response-dashboard.dto';
import { ResponseAdminDashboardDto } from './dto/response-admin-dashboard.dto';

@Injectable()
export class DashboardsService {
    constructor(
        private readonly usersService: UsersService,
        private readonly rolesService: RolesService,
        private readonly permissionsService: PermissionsService,
        private readonly matricesService: MatricesService,
        private readonly visualizationsService: VisualizationsService,
        private readonly matrixRequestsService: MatrixRequestsService,
    ) {}

    async findUserStats(user: User): Promise<ResponseDashboardDto> {
        const totalMatricesPromise: Promise<number> = this.matricesService.countByUser(user.id);
        const totalVisualizationsPromise: Promise<number> = this.visualizationsService.countByUser(user.id);
        const activeRequestsPromise: Promise<MatrixRequestListItemDto[]> =
            this.matrixRequestsService.findActiveByUser(user);
        const failedRequestsPromise: Promise<MatrixRequestListItemDto[]> =
            this.matrixRequestsService.findFailedByUser(user);

        const [totalMatrices, totalVisualizations, activeRequests, failedRequests] = await Promise.all([
            totalMatricesPromise,
            totalVisualizationsPromise,
            activeRequestsPromise,
            failedRequestsPromise,
        ]);

        return new ResponseDashboardDto(totalMatrices, totalVisualizations, activeRequests, failedRequests);
    }

    async findAdminStats(): Promise<ResponseAdminDashboardDto> {
        const totalUsersPromise: Promise<number> = this.usersService.count();
        const totalRolesPromise: Promise<number> = this.rolesService.count();
        const totalPermissionsPromise: Promise<number> = this.permissionsService.count();
        const totalMatricesPromise: Promise<number> = this.matricesService.countAll();
        const totalVisualizationsPromise: Promise<number> = this.visualizationsService.countAll();
        const totalMatrixRequestsTodayPromise: Promise<number> = this.matrixRequestsService.countToday();

        const [totalUsers, totalRoles, totalPermissions, totalMatrices, totalVisualizations, totalMatrixRequestsToday] =
            await Promise.all([
                totalUsersPromise,
                totalRolesPromise,
                totalPermissionsPromise,
                totalMatricesPromise,
                totalVisualizationsPromise,
                totalMatrixRequestsTodayPromise,
            ]);

        return new ResponseAdminDashboardDto(
            totalUsers,
            totalRoles,
            totalPermissions,
            totalMatrices,
            totalVisualizations,
            totalMatrixRequestsToday,
        );
    }
}
