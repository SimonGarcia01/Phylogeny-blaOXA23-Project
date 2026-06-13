import { Injectable } from '@nestjs/common';

import { User } from 'src/auth/users/entities/user.entity';
import { MatricesService } from 'src/matrices/matrices.service';
import { VisualizationsService } from 'src/visualizations/visualizations.service';
import { MatrixRequestsService } from 'src/matrix-requests/matrix-requests.service';
import { MatrixRequestListItemDto } from 'src/matrix-requests/dto/response-m-r-list-item.dto';

import { ResponseDashboardDto } from './dto/response-dashboard.dto';

@Injectable()
export class DashboardsService {
    constructor(
        private readonly matricesService: MatricesService,
        private readonly visualizationsService: VisualizationsService,
        private readonly matrixRequestsService: MatrixRequestsService,
    ) {}

    async findUserStats(user: User): Promise<ResponseDashboardDto> {
        //Making all these promises so then they can be called in parallel
        const totalMatricesPromise: Promise<number> = this.matricesService.countByUser(user.id);
        const totalVisualizationsPromise: Promise<number> = this.visualizationsService.countByUser(user.id);
        const activeRequestsPromise: Promise<MatrixRequestListItemDto[]> =
            this.matrixRequestsService.findActiveByUser(user);
        const failedRequestsPromise: Promise<MatrixRequestListItemDto[]> =
            this.matrixRequestsService.findFailedByUser(user);

        //Await all promises at the same time to optimize performance
        const [totalMatrices, totalVisualizations, activeRequests, failedRequests] = await Promise.all([
            totalMatricesPromise,
            totalVisualizationsPromise,
            activeRequestsPromise,
            failedRequestsPromise,
        ]);

        return new ResponseDashboardDto(totalMatrices, totalVisualizations, activeRequests, failedRequests);
    }
}
