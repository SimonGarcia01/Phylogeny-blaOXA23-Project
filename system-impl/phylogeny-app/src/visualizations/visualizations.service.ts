import { Inject, Injectable, NotFoundException, ServiceUnavailableException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MinioService } from 'src/common/utils/minio/minio.service';
import { ResponseMessage } from 'src/common/dtos/response-message';
import { User } from 'src/auth/users/entities/user.entity';
import { BusinessRuleViolationException } from 'src/common/exceptions/business-rule-violation-exception';
import { MatricesService } from 'src/matrices/matrices.service';
import { Matrix } from 'src/matrices/entities/matrix.entity';
import { MatrixRequestsService } from 'src/matrix-requests/matrix-requests.service';
import { MatrixRequest, MatrixRequestStatus } from 'src/matrix-requests/entities/matrix-request.entity';
import { MicroserviceService } from 'src/common/utils/api/services/microservice.service';
import { assertOwnership } from 'src/auth/utils/user-ownership.util';
import { MicroserviceAnalysisResponse } from 'src/common/utils/api/interfaces/response-analyze.interface';

import { UpdateVisualizationDto } from './dto/update-visualization.dto';
import { Visualization } from './entities/visualization.entity';
import { ResponseVisualizationListItemDto } from './dto/response-visualization-list-item.dto';
import { ResponseVisualizationDetailDto } from './dto/response-visualization-detail.dto';
import { ResponseAnalyzeDto } from './dto/response-analyze.dto';
import { FinalizeVisualizationDto } from './dto/request-finalize-visualization.dto';

@Injectable()
export class VisualizationsService {
    constructor(
        @InjectRepository(Visualization)
        private readonly visualizationRepository: Repository<Visualization>,
        @Inject(forwardRef(() => MatricesService))
        private readonly matricesService: MatricesService,
        private readonly minioService: MinioService,
        private readonly matrixRequestsService: MatrixRequestsService,
        private readonly microserviceService: MicroserviceService,
    ) {}

    // -----------------------------------------------------------------------
    // User triggers analysis — creates skeleton visualization + matrix request
    // -----------------------------------------------------------------------
    async analyze(user: User, matrixId: string): Promise<ResponseAnalyzeDto> {
        const matrix: Matrix = await this.matricesService.findOneByMatrixId(matrixId);

        assertOwnership(matrix.user.id, user.id, 'matrix');

        if (matrix.visualization) {
            throw new BusinessRuleViolationException('This matrix already has a visualization.');
        }

        //This are precreated so we can send the analysis request to see if it's going to work
        const visualizationId: string = crypto.randomUUID();
        const visualizationObjectKey: string = `users/${user.id}/visualizations/${visualizationId}`;

        //This will store the failed attempt is if doesn't work so we can create the MatrixRequest record
        const matrixRequest: MatrixRequest = await this.matrixRequestsService.create({
            name: matrix.name,
            matrix,
        });

        try {
            const response: MicroserviceAnalysisResponse = await this.microserviceService.triggerAnalysis({
                matrixObjectKey: matrix.objectKey,
                visualizationObjectKey: visualizationObjectKey,
                visualizationId: visualizationId,
                matrixRequestId: matrixRequest.id,
            });

            await this.matrixRequestsService.addTaskId(matrixRequest.id, response.taskId);
        } catch (error) {
            console.error(error);
            await this.matrixRequestsService.updateStatus(matrixRequest.id, {
                status: MatrixRequestStatus.FAILED,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new ServiceUnavailableException('The analysis service is currently unavailable.');
        }

        //If nothing fails, then we can create the visualization record
        //The matrix-request record will keep the "pending" status until the microservice updates it
        const visualization: Visualization = this.visualizationRepository.create({
            visualizationId,
            name: matrix.name,
            objectKey: visualizationObjectKey,
            user,
        });
        await this.visualizationRepository.save(visualization);

        //Update the visualizationId in the matrix at the end
        await this.matricesService.updateVisualizationId(matrixId, visualizationId);

        return new ResponseAnalyzeDto(matrixRequest.id, visualizationId, MatrixRequestStatus.PENDING);
    }

    // -----------------------------------------------------------------------
    // Internal — microservice finalizes the record after uploading results
    // -----------------------------------------------------------------------
    async finalize(visualizationId: string, dto: FinalizeVisualizationDto): Promise<ResponseMessage> {
        const visualization: Visualization | null = await this.visualizationRepository.findOneBy({
            visualizationId,
        });

        if (!visualization) {
            throw new NotFoundException(`Visualization ${visualizationId} not found.`);
        }

        visualization.fileSize = dto.fileSize;
        visualization.mimeType = dto.mimeType;

        await this.visualizationRepository.save(visualization);

        return new ResponseMessage(`Visualization ${visualizationId} finalized successfully.`);
    }

    // -----------------------------------------------------------------------
    // User-facing CRUD — all scoped to the requesting user
    // -----------------------------------------------------------------------
    async findAll(user: User): Promise<ResponseVisualizationListItemDto[]> {
        const visualizations: Visualization[] = await this.visualizationRepository.find({
            where: { user: { id: user.id } },
            order: { createdAt: 'DESC' },
        });

        return visualizations.map(
            (v) => new ResponseVisualizationListItemDto(v.visualizationId, v.name, v.createdAt, v.fileSize),
        );
    }

    async findOne(visualizationId: string, user: User): Promise<ResponseVisualizationDetailDto> {
        const visualization: Visualization | null = await this.visualizationRepository.findOne({
            where: { visualizationId },
            relations: ['matrix', 'user'],
        });

        if (!visualization) {
            throw new NotFoundException(`The entered visualization ID ${visualizationId} wasn't found.`);
        }

        assertOwnership(visualization.user.id, user.id, 'visualization');

        return new ResponseVisualizationDetailDto(
            visualization.visualizationId,
            visualization.name,
            visualization.description,
            visualization.createdAt,
            visualization.fileSize,
            visualization.matrix?.matrixId,
        );
    }

    async update(
        visualizationId: string,
        updateVisualizationDto: UpdateVisualizationDto,
        user: User,
    ): Promise<ResponseMessage> {
        const visualization: Visualization | null = await this.visualizationRepository.findOne({
            where: { visualizationId },
            relations: ['user', 'matrix'],
        });

        if (!visualization) {
            throw new NotFoundException(`The entered visualization ID ${visualizationId} wasn't found.`);
        }

        assertOwnership(visualization.user.id, user.id, 'visualization');

        if (updateVisualizationDto.name && updateVisualizationDto.name !== visualization.name) {
            const nameExists: boolean = await this.visualizationNameExists(updateVisualizationDto.name, user.id);
            if (nameExists) {
                throw new BusinessRuleViolationException(
                    `A visualization with the name ${updateVisualizationDto.name} already exists.`,
                );
            }
        }

        const { matrixId, ...rest } = updateVisualizationDto;

        if (matrixId && visualization.matrix?.matrixId !== matrixId) {
            const targetMatrix: Matrix = await this.matricesService.findOneByMatrixId(matrixId);

            if (
                targetMatrix.visualization &&
                targetMatrix.visualization.visualizationId !== visualization.visualizationId
            ) {
                throw new BusinessRuleViolationException('This matrix already has a visualization.');
            }

            await this.matricesService.updateVisualizationId(matrixId, visualization.visualizationId);
        }

        Object.assign(visualization, rest);
        await this.visualizationRepository.save(visualization);

        return new ResponseMessage(
            `The visualization with the name ${visualization.name} has been updated successfully (ID: ${visualizationId}).`,
        );
    }

    async remove(visualizationId: string, user: User): Promise<ResponseMessage> {
        const visualization: Visualization | null = await this.visualizationRepository.findOne({
            where: { visualizationId },
            relations: ['user', 'matrix'],
        });

        if (!visualization) {
            throw new NotFoundException(`The entered visualization ID ${visualizationId} wasn't found.`);
        }

        assertOwnership(visualization.user.id, user.id, 'visualization');

        await this.minioService.deleteFile(this.minioService.visualizationBucketName, visualization.objectKey);
        await this.visualizationRepository.remove(visualization);

        return new ResponseMessage(
            `The visualization with the name ${visualization.name} has been removed successfully (ID: ${visualizationId}).`,
        );
    }

    async getTreeUrl(visualizationId: string, user: User): Promise<{ url: string }> {
        const visualization: Visualization | null = await this.visualizationRepository.findOne({
            where: { visualizationId },
            relations: ['user'],
        });

        if (!visualization) {
            throw new NotFoundException(`The entered visualization ID ${visualizationId} wasn't found.`);
        }

        assertOwnership(visualization.user.id, user.id, 'visualization');

        if (visualization.fileSize == null) {
            throw new BusinessRuleViolationException('Visualization is not yet ready — analysis still in progress.');
        }

        const url: string = await this.minioService.generatePresignedGetUrl(
            this.minioService.visualizationBucketName,
            visualization.objectKey,
        );
        return { url };
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------
    async countByUser(userId: number): Promise<number> {
        return await this.visualizationRepository.count({ where: { user: { id: userId } } });
    }

    async countAll(): Promise<number> {
        return this.visualizationRepository.count();
    }

    async objectKeyExists(objectKey: string): Promise<boolean> {
        const visualization: Visualization | null = await this.visualizationRepository.findOneBy({ objectKey });
        return !!visualization;
    }

    async visualizationNameExists(name: string, userId: number): Promise<boolean> {
        const visualization: Visualization | null = await this.visualizationRepository.findOne({
            where: { name, user: { id: userId } },
        });
        return !!visualization;
    }

    async findVisualizationByVisualizationId(visualizationId: string): Promise<Visualization> {
        const visualization: Visualization | null = await this.visualizationRepository.findOneBy({ visualizationId });
        if (!visualization) {
            throw new NotFoundException(`The entered visualization ID ${visualizationId} wasn't found.`);
        }
        return visualization;
    }

    // Kept for internal use by MatricesService
    async findOneByVisualizationId(visualizationId: string): Promise<Visualization> {
        const visualization: Visualization | null = await this.visualizationRepository.findOneBy({ visualizationId });
        if (!visualization) {
            throw new NotFoundException(`The entered visualization ID ${visualizationId} wasn't found.`);
        }
        return visualization;
    }
}
