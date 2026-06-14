import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Put } from '@nestjs/common';

import { Permissions } from 'src/common/decorators/permissions.decorator';
import { ResponseMessage } from 'src/common/dtos/response-message';

import { RolesPermissionsService } from './roles-permissions.service';
import { CreateRolesPermissionDto } from './dto/create-roles-permission.dto';
import { UpdateRolesPermissionDto } from './dto/update-roles-permission.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { ResponseRolesPermissionDto } from './dto/response-roles-permission.dto';

@Controller('roles-permissions')
export class RolesPermissionsController {
    constructor(private readonly rolesPermissionsService: RolesPermissionsService) {}

    @Post()
    @Permissions('ROLES_PERMISSIONS_CREATE')
    async create(@Body() createRolesPermissionDto: CreateRolesPermissionDto): Promise<ResponseMessage> {
        return await this.rolesPermissionsService.create(createRolesPermissionDto);
    }

    @Get()
    @Permissions('ROLES_PERMISSIONS_READ')
    async findAll(): Promise<ResponseRolesPermissionDto[]> {
        return await this.rolesPermissionsService.findAll();
    }

    @Get(':id')
    @Permissions('ROLES_PERMISSIONS_READ')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseRolesPermissionDto> {
        return await this.rolesPermissionsService.findOne(+id);
    }

    @Patch(':id')
    @Permissions('ROLES_PERMISSIONS_UPDATE')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateRolesPermissionDto: UpdateRolesPermissionDto,
    ): Promise<ResponseMessage> {
        return await this.rolesPermissionsService.update(id, updateRolesPermissionDto);
    }

    @Delete(':id')
    @Permissions('ROLES_PERMISSIONS_DELETE')
    async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseMessage> {
        return await this.rolesPermissionsService.remove(id);
    }

    @Put('role/:roleId')
    @Permissions('ROLES_PERMISSIONS_UPDATE')
    async setPermissionsForRole(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Body() setRolePermissionsDto: SetRolePermissionsDto,
    ): Promise<ResponseMessage> {
        return await this.rolesPermissionsService.setPermissionsForRole(roleId, setRolePermissionsDto);
    }
}
