import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/auth/users/entities/user.entity';

import { DashboardsService } from './dashboards.service';

@Controller('dashboards')
export class DashboardsController {
    constructor(private readonly dashboardsService: DashboardsService) {}

    @Get('all')
    findAll() {
        return this.dashboardsService.findAll();
    }

    @Get('my')
    findUserStats(@CurrentUser() user: User) {
        return this.dashboardsService.findUserStats(user);
    }
}
