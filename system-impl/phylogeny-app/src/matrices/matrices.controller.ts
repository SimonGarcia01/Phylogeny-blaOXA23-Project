import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/auth/users/entities/user.entity';

import { MatricesService } from './matrices.service';
import { CreateMatrixDto } from './dto/create-matrix.dto';
import { UpdateMatrixDto } from './dto/update-matrix.dto';
import { ResponseMatrixListItemDto } from './dto/response-matrix-list-item.dto';

@Controller('matrices')
export class MatricesController {
    constructor(private readonly matricesService: MatricesService) {}

    @Post()
    async create(@Body() createMatrixDto: CreateMatrixDto, @CurrentUser() user: User) {
        return await this.matricesService.create(user, createMatrixDto);
    }

    @Get()
    async findAll(): Promise<ResponseMatrixListItemDto[]> {
        return await this.matricesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return await this.matricesService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateMatrixDto: UpdateMatrixDto) {
        return await this.matricesService.update(id, updateMatrixDto);
    }

    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return await this.matricesService.remove(id);
    }
}
