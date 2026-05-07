import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseUUIDPipe,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/auth/users/entities/user.entity';

import { MatricesService } from './matrices.service';
import { CreateMatrixDto } from './dto/create-matrix.dto';
import { UpdateMatrixDto } from './dto/update-matrix.dto';
import { ResponseMatrixListItemDto } from './dto/response-matrix-list-item.dto';

@Controller('matrices')
export class MatricesController {
    constructor(private readonly matricesService: MatricesService) {}

    @Post('upload-url')
    async generateUploadUrl(@CurrentUser() user: User, @Body() dto: GenerateUploadDto) {
        return this.matricesService.generateUploadUrl(user, dto);
    }

    @Post()
    //This interceptor is used to handle file uploads
    //It looks for a file in the request with the field "file"
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
        }),
    )
    async create(
        @CurrentUser() user: User,
        @Body() createMatrixDto: CreateMatrixDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return await this.matricesService.create(user, createMatrixDto, file);
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
