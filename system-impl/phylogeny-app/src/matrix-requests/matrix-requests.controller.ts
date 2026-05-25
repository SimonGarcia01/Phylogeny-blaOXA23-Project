import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { Permissions } from 'src/common/decorators/permissions.decorator';

import { MatrixRequestsService } from './matrix-requests.service';
import { CreateMatrixRequestDto } from './dto/create-matrix-request.dto';
import { UpdateMatrixRequestDto } from './dto/update-matrix-request.dto';

@Controller('matrix-requests')
export class MatrixRequestsController {
    constructor(private readonly matrixRequestsService: MatrixRequestsService) {}

    @Post()
    @Permissions('MATRIX_REQUESTS_CREATE')
    create(@Body() createMatrixRequestDto: CreateMatrixRequestDto) {
        return this.matrixRequestsService.create(createMatrixRequestDto);
    }

    @Get()
    @Permissions('MATRIX_REQUESTS_READ')
    findAll() {
        return this.matrixRequestsService.findAll();
    }

    @Get(':id')
    @Permissions('MATRIX_REQUESTS_READ')
    findOne(@Param('id') id: string) {
        return this.matrixRequestsService.findOne(+id);
    }

    @Patch(':id')
    @Permissions('MATRIX_REQUESTS_UPDATE')
    update(@Param('id') id: string, @Body() updateMatrixRequestDto: UpdateMatrixRequestDto) {
        return this.matrixRequestsService.update(+id, updateMatrixRequestDto);
    }

    @Delete(':id')
    @Permissions('MATRIX_REQUESTS_DELETE')
    remove(@Param('id') id: string) {
        return this.matrixRequestsService.remove(+id);
    }
}
