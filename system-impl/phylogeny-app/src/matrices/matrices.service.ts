import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MinioService } from 'src/utils/minio/minio.service';
import { UsersService } from 'src/auth/users/users.service';

import { CreateMatrixDto } from './dto/create-matrix.dto';
import { UpdateMatrixDto } from './dto/update-matrix.dto';
import { Matrix } from './entities/matrix.entity';
import { ResponseMatrixListItemDto } from './dto/response-matrix-list-item.dto';
import { ResponseMatrixDetailDto } from './dto/response-matrix-detail.dto';

@Injectable()
export class MatricesService {
    constructor(
        @InjectRepository(Matrix) private readonly matrixRepository: Repository<Matrix>,
        private readonly userService: UsersService,
        private readonly minioService: MinioService,
    ) {}

    async create(createMatrixDto: CreateMatrixDto) {
        return 'This action adds a new matrix';
    }

    async findAll() {
        const matrices: Matrix[] = await this.matrixRepository.find();

        return matrices.map((m) => new ResponseMatrixListItemDto(m.matrixId, m.name, m.uploadedAt));
    }

    async findOne(matrixId: string): Promise<ResponseMatrixDetailDto> {
        const matrix: Matrix | null = await this.matrixRepository.findOne({
            where: { matrixId: matrixId },
            relations: ['visualization'],
        });

        if (!matrix) {
            throw new NotFoundException(`The entered matrix ID ${matrixId} wasn't found.`);
        }

        return new ResponseMatrixDetailDto(
            matrix.matrixId,
            matrix.name,
            matrix.description,
            matrix.uploadedAt,
            matrix.fileSize,
            matrix.visualization?.visualizationId,
        );
    }

    async update(id: number, updateMatrixDto: UpdateMatrixDto) {
        return `This action updates a #${id} matrix`;
    }

    async remove(id: number) {
        return `This action removes a #${id} matrix`;
    }
}
