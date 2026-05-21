import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/auth/users/entities/user.entity';
import { RequestGenerateUrlDto } from 'src/common/dtos/request-generate-url.dto';
import { ResponseGeneratedUrlDto } from 'src/common/dtos/response-generate-url.dto';
import { ResponseMessage } from 'src/common/dtos/response-message';

import { VisualizationsService } from './visualizations.service';
import { CreateVisualizationDto } from './dto/create-visualization.dto';
import { UpdateVisualizationDto } from './dto/update-visualization.dto';
import { ResponseVisualizationListItemDto } from './dto/response-visualization-list-item.dto';
import { ResponseVisualizationDetailDto } from './dto/response-visualization-detail.dto';

@Controller('visualizations')
export class VisualizationsController {
    constructor(private readonly visualizationsService: VisualizationsService) {}

    @Post('get-visualization-upload-url')
    async generateUploadUrl(
        @CurrentUser() user: User,
        @Body() dto: RequestGenerateUrlDto,
    ): Promise<ResponseGeneratedUrlDto> {
        return this.visualizationsService.generateUploadUrl(user, dto);
    }

    @Post()
    async create(
        @CurrentUser() user: User,
        @Body() createVisualizationDto: CreateVisualizationDto,
    ): Promise<ResponseMessage> {
        return await this.visualizationsService.create(user, createVisualizationDto);
    }

    @Get()
    async findAll(): Promise<ResponseVisualizationListItemDto[]> {
        return await this.visualizationsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ResponseVisualizationDetailDto> {
        return await this.visualizationsService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateVisualizationDto: UpdateVisualizationDto,
    ): Promise<ResponseMessage> {
        return await this.visualizationsService.update(id, updateVisualizationDto);
    }

    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<ResponseMessage> {
        return await this.visualizationsService.remove(id);
    }
}
