import { RoleName } from '../entities/role.entity';

export class ResponseRoleDto {
    id?: number;
    name?: RoleName;
    description?: string;
    permissions?: string[];

    constructor(id?: number, name?: RoleName, description?: string, permissions?: string[]) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.permissions = permissions;
    }
}
