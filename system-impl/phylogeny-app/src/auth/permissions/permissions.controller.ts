import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';

import { Permissions } from 'src/common/decorators/permissions.decorator';
import { ResponseMessage } from 'src/common/dtos/response-message';

import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { ResponsePermissionDto } from './dto/response-permission.dto';

@Controller('permissions')
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) {}

    @Post()
    @Permissions('PERMISSIONS_CREATE')
    async create(@Body() createPermissionDto: CreatePermissionDto): Promise<ResponseMessage> {
        return await this.permissionsService.create(createPermissionDto);
    }

    @Get()
    @Permissions('PERMISSIONS_READ')
    async findAll(): Promise<ResponsePermissionDto[]> {
        return await this.permissionsService.findAll();
    }

    @Get(':id')
    @Permissions('PERMISSIONS_READ')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponsePermissionDto> {
        return await this.permissionsService.findOne(id);
    }

    @Patch(':id')
    @Permissions('PERMISSIONS_UPDATE')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updatePermissionDto: UpdatePermissionDto,
    ): Promise<ResponseMessage> {
        return await this.permissionsService.update(id, updatePermissionDto);
    }

    @Delete(':id')
    @Permissions('PERMISSIONS_DELETE')
    async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseMessage> {
        return await this.permissionsService.remove(id);
    }
}
