import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { User } from 'src/auth/users/entities/user.entity';
import { RoleName } from 'src/auth/roles/entities/role.entity';

import { DashboardsService } from './dashboards.service';
import { ResponseDashboardDto } from './dto/response-dashboard.dto';
import { ResponseAdminDashboardDto } from './dto/response-admin-dashboard.dto';

@Controller('dashboards')
export class DashboardsController {
    constructor(private readonly dashboardsService: DashboardsService) {}

    @Get('my')
    @Permissions('MATRICES_READ', 'VISUALIZATIONS_READ', 'MATRIX_REQUESTS_READ')
    findUserStats(@CurrentUser() user: User): Promise<ResponseDashboardDto> {
        return this.dashboardsService.findUserStats(user);
    }

    @Get('admin')
    @UseGuards(RolesGuard)
    @Roles(RoleName.ADMIN)
    findAdminStats(): Promise<ResponseAdminDashboardDto> {
        return this.dashboardsService.findAdminStats();
    }
}
