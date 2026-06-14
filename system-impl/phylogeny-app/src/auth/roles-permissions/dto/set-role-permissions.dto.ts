import { IsArray, IsInt, IsPositive } from 'class-validator';

export class SetRolePermissionsDto {
    @IsArray()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    permissionIds!: number[];
}
