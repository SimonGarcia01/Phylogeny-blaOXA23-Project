import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/auth/users/entities/user.entity';
import { ResponseMessage } from 'src/common/dtos/response-message';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { Internal } from 'src/common/decorators/internal.decorator';
import { InternalSecretGuard } from 'src/common/guards/internal-secret.guard';

import { VisualizationsService } from './visualizations.service';
import { UpdateVisualizationDto } from './dto/update-visualization.dto';
import { ResponseVisualizationListItemDto } from './dto/response-visualization-list-item.dto';
import { ResponseVisualizationDetailDto } from './dto/response-visualization-detail.dto';
import { AnalyzeMatrixDto } from './dto/request-analysis.dto';
import { ResponseAnalyzeDto } from './dto/response-analyze.dto';
import { FinalizeVisualizationDto } from './dto/request-finalize-visualization.dto';

@Controller('visualizations')
export class VisualizationsController {
    constructor(private readonly visualizationsService: VisualizationsService) {}

    @Post('analyze')
    @Permissions('VISUALIZATIONS_CREATE')
    async analyze(@CurrentUser() user: User, @Body() dto: AnalyzeMatrixDto): Promise<ResponseAnalyzeDto> {
        return await this.visualizationsService.analyze(user, dto.matrixId);
    }

    @Get()
    @Permissions('VISUALIZATIONS_READ')
    async findAll(@CurrentUser() user: User): Promise<ResponseVisualizationListItemDto[]> {
        return await this.visualizationsService.findAll(user);
    }

    @Get(':id')
    @Permissions('VISUALIZATIONS_READ')
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: User,
    ): Promise<ResponseVisualizationDetailDto> {
        return await this.visualizationsService.findOne(id, user);
    }

    @Patch(':id')
    @Permissions('VISUALIZATIONS_UPDATE')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateVisualizationDto: UpdateVisualizationDto,
        @CurrentUser() user: User,
    ): Promise<ResponseMessage> {
        return await this.visualizationsService.update(id, updateVisualizationDto, user);
    }

    @Delete(':id')
    @Permissions('VISUALIZATIONS_DELETE')
    async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<ResponseMessage> {
        return await this.visualizationsService.remove(id, user);
    }

    @Patch(':id/finalize')
    @Internal()
    @UseGuards(InternalSecretGuard)
    async finalize(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: FinalizeVisualizationDto,
    ): Promise<ResponseMessage> {
        return await this.visualizationsService.finalize(id, dto);
    }
}
