import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { VisualizationsService } from './visualizations.service';
import { CreateVisualizationDto } from './dto/create-visualization.dto';
import { UpdateVisualizationDto } from './dto/update-visualization.dto';

@Controller('visualizations')
export class VisualizationsController {
    constructor(private readonly visualizationsService: VisualizationsService) {}

    @Post()
    create(@Body() createVisualizationDto: CreateVisualizationDto) {
        return this.visualizationsService.create(createVisualizationDto);
    }

    @Get()
    findAll() {
        return this.visualizationsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.visualizationsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateVisualizationDto: UpdateVisualizationDto) {
        return this.visualizationsService.update(+id, updateVisualizationDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.visualizationsService.remove(+id);
    }
}
