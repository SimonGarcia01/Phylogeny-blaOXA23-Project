import { IsInt, IsPositive } from 'class-validator';

export class CreateRolesPermissionDto {
    @IsInt({ message: 'roleId must be an integer' })
    @IsPositive({ message: 'roleId must be a positive number' })
    roleId!: number;

    @IsInt({ message: 'permissionId must be an integer' })
    @IsPositive({ message: 'permissionId must be a positive number' })
    permissionId!: number;
}
