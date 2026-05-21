import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MinioService } from 'src/utils/minio/minio.service';
import { UsersService } from 'src/auth/users/users.service';
import { ResponseMessage } from 'src/common/dtos/response-message';
import { User } from 'src/auth/users/entities/user.entity';
import { ResponseGeneratedUrlDto } from 'src/common/dtos/response-generate-url.dto';
import { RequestGenerateUrlDto } from 'src/common/dtos/request-generate-url.dto';
import { BusinessRuleViolationException } from 'src/common/exceptions/business-rule-violation-exception';

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

    async generateUploadUrl(user: User, generateUrlDto: RequestGenerateUrlDto): Promise<ResponseGeneratedUrlDto> {
        const { fileName, fileSize, fileType } = generateUrlDto;

        if (fileSize > 10 * 1024 * 1024) {
            throw new BadRequestException('File size exceeds the 10MB limit.');
        }

        const matrixNameExist: Matrix | null = await this.matrixRepository.findOne({
            where: {
                name: fileName,
                user: { id: user.id },
            },
        });

        if (matrixNameExist) {
            throw new BusinessRuleViolationException('A matrix with the same name already exists.');
        }

        if (!fileType.toLowerCase().includes('.nex')) {
            throw new BusinessRuleViolationException('Only .nex files are allowed.');
        }

        let randomUUID: string = crypto.randomUUID();

        //This is what defines the minimum length:
        //Baseline it has users/matrices/ = 16 characters
        //UUID v4 has 36 characters = 52 characters total
        //The user ID is an integer, so minimum 1 character = 53 chars total
        let objectKey: string = `users/${user.id}/matrices/${randomUUID}`;

        //Should never happen, but just in case, regenerate it once
        if (await this.objectKeyExists(objectKey)) {
            randomUUID = crypto.randomUUID();
            objectKey = `users/${user.id}/matrices/${randomUUID}`;
        }

        const presignedUrl: string = await this.minioService.generatePresignedPutUrl('matrices', objectKey);

        return new ResponseGeneratedUrlDto(randomUUID, objectKey, presignedUrl);
    }

    async objectKeyExists(objectKey: string): Promise<boolean> {
        const matrix: Matrix | null = await this.matrixRepository.findOneBy({ objectKey: objectKey });
        return !!matrix;
    }

    //The create method is called after the file has been uploaded to MinIO, just to store the metadata
    async create(user: User, createMatrixDto: CreateMatrixDto): Promise<ResponseMessage> {
        const newMatrix: Matrix = this.matrixRepository.create({
            ...createMatrixDto,
            user: user,
            uploadedAt: new Date(),
        });

        await this.matrixRepository.save(newMatrix);

        return new ResponseMessage(
            `The matrix ${createMatrixDto.name} has been uploaded successfully (ID: ${createMatrixDto.matrixId}).`,
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
