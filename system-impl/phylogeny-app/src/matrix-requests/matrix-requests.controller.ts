import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { MatrixRequestsService } from './matrix-requests.service';
import { CreateMatrixRequestDto } from './dto/create-matrix-request.dto';
import { UpdateMatrixRequestDto } from './dto/update-matrix-request.dto';

@Controller('matrix-requests')
export class MatrixRequestsController {
    constructor(private readonly matrixRequestsService: MatrixRequestsService) {}

    @Post()
    create(@Body() createMatrixRequestDto: CreateMatrixRequestDto) {
        return this.matrixRequestsService.create(createMatrixRequestDto);
    }

    @Get()
    findAll() {
        return this.matrixRequestsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.matrixRequestsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateMatrixRequestDto: UpdateMatrixRequestDto) {
        return this.matrixRequestsService.update(+id, updateMatrixRequestDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.matrixRequestsService.remove(+id);
    }
}
