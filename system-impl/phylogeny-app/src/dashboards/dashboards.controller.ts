import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { User } from 'src/auth/users/entities/user.entity';

import { DashboardsService } from './dashboards.service';
import { ResponseDashboardDto } from './dto/response-dashboard.dto';

@Controller('dashboards')
export class DashboardsController {
    constructor(private readonly dashboardsService: DashboardsService) {}

    @Get('my')
    @Permissions('MATRICES_READ', 'VISUALIZATIONS_READ', 'MATRIX_REQUESTS_READ')
    findUserStats(@CurrentUser() user: User): Promise<ResponseDashboardDto> {
        return this.dashboardsService.findUserStats(user);
    }
}
