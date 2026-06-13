import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { MatricesModule } from 'src/matrices/matrices.module';
import { VisualizationsModule } from 'src/visualizations/visualizations.module';
import { MatrixRequestsModule } from 'src/matrix-requests/matrix-requests.module';

import { DashboardsService } from './dashboards.service';
import { DashboardsController } from './dashboards.controller';

@Module({
    imports: [AuthModule, MatricesModule, VisualizationsModule, MatrixRequestsModule],
    controllers: [DashboardsController],
    providers: [DashboardsService],
})
export class DashboardsModule {}
