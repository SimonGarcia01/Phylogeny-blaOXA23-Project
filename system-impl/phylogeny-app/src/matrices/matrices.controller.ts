import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';

import { MatricesService } from './matrices.service';
import { CreateMatrixDto } from './dto/create-matrix.dto';
import { UpdateMatrixDto } from './dto/update-matrix.dto';

@Controller('matrices')
export class MatricesController {
    constructor(private readonly matricesService: MatricesService) {}

    @Post()
    create(@Body() createMatrixDto: CreateMatrixDto) {
        return this.matricesService.create(createMatrixDto);
    }

    @Get()
    findAll() {
        return this.matricesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.matricesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateMatrixDto: UpdateMatrixDto) {
        return this.matricesService.update(id, updateMatrixDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.matricesService.remove(id);
    }
}
