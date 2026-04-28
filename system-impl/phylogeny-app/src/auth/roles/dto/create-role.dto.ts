import { IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';

import { RoleName } from '../entities/role.entity';

export class CreateRoleDto {
    @IsEnum(RoleName, { message: 'Name must be a valid role name' })
    name!: RoleName;

    @IsString({ message: 'Description must be a string' })
    @MaxLength(255, { message: 'Description must be at most 255 characters' })
    @IsOptional()
    description?: string;
}
