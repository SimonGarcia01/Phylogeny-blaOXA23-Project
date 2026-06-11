import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MinioService } from 'src/common/utils/minio/minio.service';
import { ResponseMessage } from 'src/common/dtos/response-message';
import { User } from 'src/auth/users/entities/user.entity';
import { ResponseGeneratedUrlDto } from 'src/common/dtos/response-generate-url.dto';
import { RequestGenerateUrlDto } from 'src/common/dtos/request-generate-url.dto';
import { BusinessRuleViolationException } from 'src/common/exceptions/business-rule-violation-exception';
import { VisualizationsService } from 'src/visualizations/visualizations.service';

import { CreateMatrixDto } from './dto/create-matrix.dto';
import { UpdateMatrixDto } from './dto/update-matrix.dto';
import { Matrix } from './entities/matrix.entity';
import { ResponseMatrixListItemDto } from './dto/response-matrix-list-item.dto';
import { ResponseMatrixDetailDto } from './dto/response-matrix-detail.dto';

@Injectable()
export class MatricesService {
    constructor(
        @InjectRepository(Matrix) private readonly matrixRepository: Repository<Matrix>,
        private readonly minioService: MinioService,
        @Inject(forwardRef(() => VisualizationsService))
        private readonly visualizationsService: VisualizationsService,
    ) {}

    async generateUploadUrl(user: User, generateUrlDto: RequestGenerateUrlDto): Promise<ResponseGeneratedUrlDto> {
        const { fileName, fileSize, fileType } = generateUrlDto;

        if (fileSize > 10 * 1024 * 1024) {
            throw new BadRequestException('File size exceeds the 10MB limit.');
        }

        const matrixNameExist: boolean = await this.matrixNameExists(fileName, user.id);

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

        const presignedUrl: string = await this.minioService.generatePresignedPutUrl(
            this.minioService.matrixBucketName,
            objectKey,
        );

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

    //This is the method that returns the details of a matrix (metadata)
    //This will also include the metadata of the visualization if it exists
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
        const matrix: Matrix | null = await this.matrixRepository.findOne({
            where: { matrixId: matrixId },
            relations: ['user', 'visualization'],
        });
        if (!matrix) throw new NotFoundException(`The entered matrix ID ${matrixId} wasn't found.`);
        return matrix;
    }

    //The update method will make sure the matrix exists
    async update(matrixId: string, updateMatrixDto: UpdateMatrixDto): Promise<ResponseMessage> {
        //Make sure the matrix exists before updating
        const matrix: Matrix | null = await this.matrixRepository.findOneBy({ matrixId: matrixId });

        if (!matrix) throw new NotFoundException(`The entered matrix ID ${matrixId} wasn't found.`);

        //If the name is going to change, make sure it's unique to the user
        if (updateMatrixDto.name && updateMatrixDto.name !== matrix.name) {
            const matrixNameExists: boolean = await this.matrixNameExists(updateMatrixDto.name, matrix.user.id);
            if (matrixNameExists) {
                throw new BusinessRuleViolationException(
                    `A matrix with the name ${updateMatrixDto.name} already exists.`,
                );
            }
        }

        await this.matrixRepository.update({ matrixId: matrixId }, updateMatrixDto);

        return new ResponseMessage(
            `The matrix with the name ${matrix.name} has been updated successfully (ID: ${matrixId}).`,
        );
    }

    async remove(matrixId: string): Promise<ResponseMessage> {
        //Make sure the matrix exists before deleting
        const matrix: Matrix | null = await this.matrixRepository.findOneBy({ matrixId: matrixId });

        if (!matrix) throw new NotFoundException(`The entered matrix ID ${matrixId} wasn't found.`);

        await this.minioService.deleteFile(this.minioService.matrixBucketName, matrix.objectKey);
        await this.matrixRepository.remove(matrix);

        return new ResponseMessage(
            `The matrix with the name ${matrix.name} has been removed successfully (ID: ${matrixId}).`,
        );
    }

    async matrixNameExists(name: string, userId: number): Promise<boolean> {
        const matrix: Matrix | null = await this.matrixRepository.findOne({
            where: {
                name: name,
                user: { id: userId },
            },
        });
        return !!matrix;
    }

    async updateVisualizationId(matrixId: string, visualizationId: string): Promise<void> {
        const matrix: Matrix | null = await this.matrixRepository.findOne({
            where: { matrixId: matrixId },
            relations: ['visualization'],
        });
        if (!matrix) throw new NotFoundException(`The entered matrix ID ${matrixId} wasn't found.`);

        if (matrix.visualization && matrix.visualization.visualizationId !== visualizationId) {
            throw new BusinessRuleViolationException('This matrix already has a visualization.');
        }

        const visualization = await this.visualizationsService.findVisualizationByVisualizationId(visualizationId);

        const linkedMatrix: Matrix | null = await this.matrixRepository.findOne({
            where: { visualization: { visualizationId: visualizationId } },
            relations: ['visualization'],
        });

        if (linkedMatrix && linkedMatrix.matrixId !== matrixId) {
            throw new BusinessRuleViolationException('This visualization is already linked to another matrix.');
        }

        matrix.visualization = visualization;
        await this.matrixRepository.save(matrix);
    }
}
