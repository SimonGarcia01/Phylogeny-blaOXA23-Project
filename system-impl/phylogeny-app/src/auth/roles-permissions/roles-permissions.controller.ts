import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';

import { ResponseMessage } from 'src/common/dtos/response-message';

import { RolesPermissionsService } from './roles-permissions.service';
import { CreateRolesPermissionDto } from './dto/create-roles-permission.dto';
import { UpdateRolesPermissionDto } from './dto/update-roles-permission.dto';
import { ResponseRolesPermissionDto } from './dto/response-roles-permission.dto';

@Controller('roles-permissions')
export class RolesPermissionsController {
    constructor(private readonly rolesPermissionsService: RolesPermissionsService) {}

    @Post()
    async create(@Body() createRolesPermissionDto: CreateRolesPermissionDto): Promise<ResponseMessage> {
        return await this.rolesPermissionsService.create(createRolesPermissionDto);
    }

    @Get()
    async findAll(): Promise<ResponseRolesPermissionDto[]> {
        return await this.rolesPermissionsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseRolesPermissionDto> {
        return await this.rolesPermissionsService.findOne(+id);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateRolesPermissionDto: UpdateRolesPermissionDto,
    ): Promise<ResponseMessage> {
        return await this.rolesPermissionsService.update(id, updateRolesPermissionDto);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseMessage> {
        return await this.rolesPermissionsService.remove(id);
    }
}
