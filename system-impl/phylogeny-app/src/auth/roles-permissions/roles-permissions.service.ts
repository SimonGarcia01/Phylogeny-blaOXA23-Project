import { Injectable } from '@nestjs/common';
import { CreateRolesPermissionDto } from './dto/create-roles-permission.dto';
import { UpdateRolesPermissionDto } from './dto/update-roles-permission.dto';

@Injectable()
export class RolesPermissionsService {
  create(createRolesPermissionDto: CreateRolesPermissionDto) {
    return 'This action adds a new rolesPermission';
  }

  findAll() {
    return `This action returns all rolesPermissions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rolesPermission`;
  }

  update(id: number, updateRolesPermissionDto: UpdateRolesPermissionDto) {
    return `This action updates a #${id} rolesPermission`;
  }

  remove(id: number) {
    return `This action removes a #${id} rolesPermission`;
  }
}
