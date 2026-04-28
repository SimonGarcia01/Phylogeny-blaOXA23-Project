import { RoleName } from '../entities/role.entity';

export class ResponseRoleDto {
    name?: RoleName;
    description?: string;

    constructor(name?: RoleName, description?: string) {
        this.name = name;
        this.description = description;
    }
}
