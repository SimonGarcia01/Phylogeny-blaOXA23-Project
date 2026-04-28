import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';

import { ResponseMessage } from 'src/common/dtos/response-message';

import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ResponseRoleDto } from './dto/response-role.dto';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Post()
    async create(@Body() createRoleDto: CreateRoleDto): Promise<ResponseMessage> {
        return await this.rolesService.create(createRoleDto);
    }

    @Get()
    async findAll(): Promise<ResponseRoleDto[]> {
        return await this.rolesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseRoleDto> {
        return await this.rolesService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateRoleDto: UpdateRoleDto,
    ): Promise<ResponseMessage> {
        return await this.rolesService.update(id, updateRoleDto);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseMessage> {
        return await this.rolesService.remove(id);
    }
}
