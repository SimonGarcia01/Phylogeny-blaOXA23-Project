import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';

import { Permissions } from 'src/common/decorators/permissions.decorator';
import { ResponseMessage } from 'src/common/dtos/response-message';

import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ResponseRoleDto } from './dto/response-role.dto';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Post()
    @Permissions('ROLES_CREATE')
    async create(@Body() createRoleDto: CreateRoleDto): Promise<ResponseMessage> {
        return await this.rolesService.create(createRoleDto);
    }

    @Get()
    @Permissions('ROLES_READ')
    async findAll(): Promise<ResponseRoleDto[]> {
        return await this.rolesService.findAll();
    }

    @Get(':id')
    @Permissions('ROLES_READ')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseRoleDto> {
        return await this.rolesService.findOne(id);
    }

    @Patch(':id')
    @Permissions('ROLES_UPDATE')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateRoleDto: UpdateRoleDto,
    ): Promise<ResponseMessage> {
        return await this.rolesService.update(id, updateRoleDto);
    }

    @Delete(':id')
    @Permissions('ROLES_DELETE')
    async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseMessage> {
        return await this.rolesService.remove(id);
    }
}
