import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/auth/users/entities/user.entity';
import { RequestGenerateUrlDto } from 'src/common/dtos/request-generate-url.dto';
import { ResponseGeneratedUrlDto } from 'src/common/dtos/response-generate-url.dto';
import { ResponseMessage } from 'src/common/dtos/response-message';
import { Permissions } from 'src/common/decorators/permissions.decorator';

import { MatricesService } from './matrices.service';
import { CreateMatrixDto } from './dto/create-matrix.dto';
import { UpdateMatrixDto } from './dto/update-matrix.dto';
import { ResponseMatrixListItemDto } from './dto/response-matrix-list-item.dto';
import { ResponseMatrixDetailDto } from './dto/response-matrix-detail.dto';

@Controller('matrices')
export class MatricesController {
    constructor(private readonly matricesService: MatricesService) {}

    @Post('get-matrix-upload-url')
    @Permissions('MATRICES_CREATE')
    async generateUploadUrl(
        @CurrentUser() user: User,
        @Body() dto: RequestGenerateUrlDto,
    ): Promise<ResponseGeneratedUrlDto> {
        return this.matricesService.generateUploadUrl(user, dto);
    }

    @Post()
    @Permissions('MATRICES_CREATE')
    async create(@CurrentUser() user: User, @Body() createMatrixDto: CreateMatrixDto): Promise<ResponseMessage> {
        return await this.matricesService.create(user, createMatrixDto);
    }

    @Get()
    @Permissions('MATRICES_READ')
    async findAll(): Promise<ResponseMatrixListItemDto[]> {
        return await this.matricesService.findAll();
    }

    @Get(':id')
    @Permissions('MATRICES_READ')
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ResponseMatrixDetailDto> {
        return await this.matricesService.findOne(id);
    }

    @Patch(':id')
    @Permissions('MATRICES_UPDATE')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateMatrixDto: UpdateMatrixDto,
    ): Promise<ResponseMessage> {
        return await this.matricesService.update(id, updateMatrixDto);
    }

    @Delete(':id')
    @Permissions('MATRICES_DELETE')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return await this.matricesService.remove(id);
    }
}
