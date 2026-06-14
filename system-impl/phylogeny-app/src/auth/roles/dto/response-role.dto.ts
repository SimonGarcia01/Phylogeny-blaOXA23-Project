import { RoleName } from '../entities/role.entity';

export class ResponseRoleDto {
    name?: RoleName;
    description?: string;
    permissions?: string[];

    constructor(name?: RoleName, description?: string, permissions?: string[]) {
        this.name = name;
        this.description = description;
        this.permissions = permissions;
    }
}
