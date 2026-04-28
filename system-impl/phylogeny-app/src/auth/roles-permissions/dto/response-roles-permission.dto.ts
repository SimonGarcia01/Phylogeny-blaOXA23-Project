export class ResponseRolesPermissionDto {
    id?: number;
    roleId?: number;
    permissionId?: number;

    constructor(id?: number, roleId?: number, permissionId?: number) {
        this.id = id;
        this.roleId = roleId;
        this.permissionId = permissionId;
    }
}
