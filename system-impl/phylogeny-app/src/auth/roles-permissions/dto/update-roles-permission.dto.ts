import { PartialType } from '@nestjs/mapped-types';
import { CreateRolesPermissionDto } from './create-roles-permission.dto';

export class UpdateRolesPermissionDto extends PartialType(CreateRolesPermissionDto) {}
