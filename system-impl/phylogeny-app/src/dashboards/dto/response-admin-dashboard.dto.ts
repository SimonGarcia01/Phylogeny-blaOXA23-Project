export class ResponseAdminDashboardDto {
    totalUsers: number;
    totalRoles: number;
    totalPermissions: number;
    totalMatrices: number;
    totalVisualizations: number;
    totalMatrixRequestsToday: number;

    constructor(
        totalUsers: number,
        totalRoles: number,
        totalPermissions: number,
        totalMatrices: number,
        totalVisualizations: number,
        totalMatrixRequestsToday: number,
    ) {
        this.totalUsers = totalUsers;
        this.totalRoles = totalRoles;
        this.totalPermissions = totalPermissions;
        this.totalMatrices = totalMatrices;
        this.totalVisualizations = totalVisualizations;
        this.totalMatrixRequestsToday = totalMatrixRequestsToday;
    }
}
