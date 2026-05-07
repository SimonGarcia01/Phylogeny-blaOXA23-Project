import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MinioService } from 'src/utils/minio/minio.service';
import { UsersService } from 'src/auth/users/users.service';
import { ResponseMessage } from 'src/common/dtos/response-message';
import { User } from 'src/auth/users/entities/user.entity';

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

    async create(user: User, createMatrixDto: CreateMatrixDto, file: Express.Multer.File): Promise<ResponseMessage> {
        if (!file) throw new BadRequestException('No file provided. Please include a file.');

        if (!file.originalname.toLowerCase().endsWith('.nex')) {
            throw new BadRequestException('Invalid file type. Only .nex files are allowed.');
        }

        const mimeType: string = file.mimetype || 'application/octet-stream';

        const randomUUID: string = crypto.randomUUID();

        //Object key to store in minIO, structured as users/{userId}/matrices/{matrixId}/{originalFileName}
        const objectKey: string = `users/${user.id}/matrices/${randomUUID}/${file.originalname}`;

        //Make sure the bucket exists, if it doesn't create it
        await this.minioService.ensureBucket('matrices');

        //Upload the file to minIO
        await this.minioService.uploadFile('matrices', objectKey, file);

        const newMatrix: Matrix = this.matrixRepository.create({
            ...createMatrixDto,
            matrixId: randomUUID,
            user: user,
            objectKey: objectKey,
            fileSize: file.size,
            mimeType: file.mimetype || 'application/octet-stream',
            uploadedAt: new Date(),
        });

        await this.matrixRepository.save(newMatrix);

        return new ResponseMessage(
            `The matrix ${createMatrixDto.name} has been uploaded successfully (ID: ${randomUUID}).`,
        );
    }

    async findAll(): Promise<ResponseMatrixListItemDto[]> {
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

    //This is for internal use only, to be used by the visualizations
    async findOneByMatrixId(matrixId: string): Promise<Matrix> {
        const matrix: Matrix | null = await this.matrixRepository.findOneBy({ matrixId: matrixId });
        if (!matrix) throw new NotFoundException(`The entered matrix ID ${matrixId} wasn't found.`);
        return matrix;
    }

    async update(matrixId: string, updateMatrixDto: UpdateMatrixDto): Promise<ResponseMessage> {
        const matrix: Matrix | null = await this.matrixRepository.findOneBy({ matrixId: matrixId });

        if (!matrix) throw new NotFoundException(`The entered matrix ID ${matrixId} wasn't found.`);

        await this.matrixRepository.update(matrixId, updateMatrixDto);

        return new ResponseMessage(
            `The matrix with the name ${matrix.name} has been updated successfully (ID: ${matrixId}).`,
        );
    }

    async remove(matrixId: string): Promise<ResponseMessage> {
        const matrix: Matrix | null = await this.matrixRepository.findOneBy({ matrixId: matrixId });

        if (!matrix) throw new NotFoundException(`The entered matrix ID ${matrixId} wasn't found.`);

        await this.matrixRepository.remove(matrix);

        return new ResponseMessage(
            `The matrix with the name ${matrix.name} has been removed successfully (ID: ${matrixId}).`,
        );
    }
}
