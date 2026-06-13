import { MatrixRequestListItemDto } from 'src/matrix-requests/dto/response-m-r-list-item.dto';

export class ResponseDashboardDto {
    totalMatrices: number;
    totalVisualizations: number;
    activeRequests: MatrixRequestListItemDto[];
    failedRequests: MatrixRequestListItemDto[];

    constructor(
        totalMatrices: number,
        totalVisualizations: number,
        activeRequests: MatrixRequestListItemDto[],
        failedRequests: MatrixRequestListItemDto[],
    ) {
        this.totalMatrices = totalMatrices;
        this.totalVisualizations = totalVisualizations;
        this.activeRequests = activeRequests;
        this.failedRequests = failedRequests;
    }
}
