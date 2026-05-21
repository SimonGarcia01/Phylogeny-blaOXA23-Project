import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MinioService } from 'src/utils/minio/minio.service';
import { ResponseMessage } from 'src/common/dtos/response-message';
import { User } from 'src/auth/users/entities/user.entity';
import { ResponseGeneratedUrlDto } from 'src/common/dtos/response-generate-url.dto';
import { RequestGenerateUrlDto } from 'src/common/dtos/request-generate-url.dto';
import { BusinessRuleViolationException } from 'src/common/exceptions/business-rule-violation-exception';
import { MatricesService } from 'src/matrices/matrices.service';
import { Matrix } from 'src/matrices/entities/matrix.entity';

import { CreateVisualizationDto } from './dto/create-visualization.dto';
import { UpdateVisualizationDto } from './dto/update-visualization.dto';
import { Visualization } from './entities/visualization.entity';
import { ResponseVisualizationListItemDto } from './dto/response-visualization-list-item.dto';
import { ResponseVisualizationDetailDto } from './dto/response-visualization-detail.dto';

@Injectable()
export class VisualizationsService {
    constructor(
        @InjectRepository(Visualization) private readonly visualizationRepository: Repository<Visualization>,
        private readonly matricesService: MatricesService,
        private readonly minioService: MinioService,
    ) {}

    async generateUploadUrl(user: User, generateUrlDto: RequestGenerateUrlDto): Promise<ResponseGeneratedUrlDto> {
        const { fileName, fileSize, fileType } = generateUrlDto;

        if (fileSize > 10 * 1024 * 1024) {
            throw new BadRequestException('File size exceeds the 10MB limit.');
        }

        const visualizationNameExist: boolean = await this.visualizationNameExists(fileName, user.id);

        if (visualizationNameExist) {
            throw new BusinessRuleViolationException('A visualization with the same name already exists.');
        }

        if (!fileType.toLowerCase().includes('.nex')) {
            throw new BusinessRuleViolationException('Only .nex files are allowed.');
        }

        let randomUUID: string = crypto.randomUUID();

        //This is what defines the minimum length:
        //Baseline it has users/{id}/visualizations/ = 23 characters (with a 1-digit user ID)
        //UUID v4 has 36 characters = 59 characters total
        let objectKey: string = `users/${user.id}/visualizations/${randomUUID}`;

        //Should never happen, but just in case, regenerate it once
        if (await this.objectKeyExists(objectKey)) {
            randomUUID = crypto.randomUUID();
            objectKey = `users/${user.id}/visualizations/${randomUUID}`;
        }

        const presignedUrl: string = await this.minioService.generatePresignedPutUrl('visualizations', objectKey);

        return new ResponseGeneratedUrlDto(randomUUID, objectKey, presignedUrl);
    }

    async objectKeyExists(objectKey: string): Promise<boolean> {
        const visualization: Visualization | null = await this.visualizationRepository.findOneBy({
            objectKey: objectKey,
        });
        return !!visualization;
    }

    //The create method is called after the file has been uploaded to MinIO, just to store the metadata
    async create(user: User, createVisualizationDto: CreateVisualizationDto): Promise<ResponseMessage> {
        const { matrixId, ...visualizationData } = createVisualizationDto;

        const matrix: Matrix = await this.matricesService.findOneByMatrixId(matrixId);

        const newVisualization: Visualization = this.visualizationRepository.create({
            ...visualizationData,
            user: user,
            matrix: matrix,
            createdAt: new Date(),
        });

        await this.visualizationRepository.save(newVisualization);

        return new ResponseMessage(
            `The visualization ${createVisualizationDto.name} has been uploaded successfully (ID: ${createVisualizationDto.visualizationId}).`,
        );
    }

    async findAll(): Promise<ResponseVisualizationListItemDto[]> {
        const visualizations: Visualization[] = await this.visualizationRepository.find();

        return visualizations.map((v) => new ResponseVisualizationListItemDto(v.visualizationId, v.name, v.createdAt));
    }

    //This is the method that returns the details of a visualization (metadata)
    //This will also include the metadata of the related matrix
    async findOne(visualizationId: string): Promise<ResponseVisualizationDetailDto> {
        const visualization: Visualization | null = await this.visualizationRepository.findOne({
            where: { visualizationId: visualizationId },
            relations: ['matrix'],
        });

        if (!visualization) {
            throw new NotFoundException(`The entered visualization ID ${visualizationId} wasn't found.`);
        }

        return new ResponseVisualizationDetailDto(
            visualization.visualizationId,
            visualization.name,
            visualization.description,
            visualization.createdAt,
            visualization.fileSize,
            visualization.matrix?.matrixId,
        );
    }

    //This is for internal use only, to be used by other modules
    async findOneByVisualizationId(visualizationId: string): Promise<Visualization> {
        const visualization: Visualization | null = await this.visualizationRepository.findOneBy({
            visualizationId: visualizationId,
        });
        if (!visualization)
            throw new NotFoundException(`The entered visualization ID ${visualizationId} wasn't found.`);
        return visualization;
    }

    //The update method will make sure the visualization exists
    async update(visualizationId: string, updateVisualizationDto: UpdateVisualizationDto): Promise<ResponseMessage> {
        //Make sure the visualization exists before updating
        const visualization: Visualization | null = await this.visualizationRepository.findOne({
            where: { visualizationId: visualizationId },
            relations: ['user', 'matrix'],
        });

        if (!visualization)
            throw new NotFoundException(`The entered visualization ID ${visualizationId} wasn't found.`);

        //If the name is going to change, make sure it's unique to the user
        if (updateVisualizationDto.name && updateVisualizationDto.name !== visualization.name) {
            const visualizationNameExists: boolean = await this.visualizationNameExists(
                updateVisualizationDto.name,
                visualization.user.id,
            );
            if (visualizationNameExists) {
                throw new BusinessRuleViolationException(
                    `A visualization with the name ${updateVisualizationDto.name} already exists.`,
                );
            }
        }

        const { matrixId, ...rest } = updateVisualizationDto;

        if (matrixId && visualization.matrix?.matrixId !== matrixId) {
            const matrix: Matrix = await this.matricesService.findOneByMatrixId(matrixId);
            visualization.matrix = matrix;
        }

        Object.assign(visualization, rest);

        await this.visualizationRepository.save(visualization);

        return new ResponseMessage(
            `The visualization with the name ${visualization.name} has been updated successfully (ID: ${visualizationId}).`,
        );
    }

    async remove(visualizationId: string): Promise<ResponseMessage> {
        //Make sure the visualization exists before deleting
        const visualization: Visualization | null = await this.visualizationRepository.findOneBy({
            visualizationId: visualizationId,
        });

        if (!visualization)
            throw new NotFoundException(`The entered visualization ID ${visualizationId} wasn't found.`);

        await this.visualizationRepository.remove(visualization);

        return new ResponseMessage(
            `The visualization with the name ${visualization.name} has been removed successfully (ID: ${visualizationId}).`,
        );
    }

    async visualizationNameExists(name: string, userId: number): Promise<boolean> {
        const visualization: Visualization | null = await this.visualizationRepository.findOne({
            where: {
                name: name,
                user: { id: userId },
            },
        });
        return !!visualization;
    }
}
