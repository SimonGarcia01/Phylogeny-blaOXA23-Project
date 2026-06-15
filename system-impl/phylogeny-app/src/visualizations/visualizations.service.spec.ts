import {
    ForbiddenException,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { VisualizationsService } from './visualizations.service';
import { MatricesService } from 'src/matrices/matrices.service';
import { MinioService } from 'src/common/utils/minio/minio.service';
import { MatrixRequestsService } from 'src/matrix-requests/matrix-requests.service';
import { MicroserviceService } from 'src/common/utils/api/services/microservice.service';
import { BusinessRuleViolationException } from 'src/common/exceptions/business-rule-violation-exception';
import { User } from 'src/auth/users/entities/user.entity';
import { RoleName } from 'src/auth/roles/entities/role.entity';
import { MatrixRequestStatus } from 'src/matrix-requests/entities/matrix-request.entity';

const mockRepo = () => ({
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
});

const mockMatricesService = () => ({
    findOneByMatrixId: jest.fn(),
    updateVisualizationId: jest.fn(),
});

const mockMinioService = () => ({
    generatePresignedGetUrl: jest.fn().mockResolvedValue('https://tree-url'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    visualizationBucketName: 'visualizations',
    matrixBucketName: 'matrices',
});

const mockMatrixRequestsService = () => ({
    create: jest.fn(),
    addTaskId: jest.fn(),
    updateStatus: jest.fn(),
});

const mockMicroserviceService = () => ({
    triggerAnalysis: jest.fn(),
});

function buildUser(id = 1): User {
    return { id, email: 'u@test.com', role: { name: RoleName.RESEARCHER } } as unknown as User;
}

function buildMatrix(userId = 1, hasVisualization = false) {
    return {
        id: 10,
        matrixId: 'matrix-uuid',
        name: 'myMatrix',
        objectKey: `users/${userId}/matrices/matrix-uuid`,
        user: buildUser(userId),
        visualization: hasVisualization ? { visualizationId: 'existing-viz' } : null,
    };
}

function buildVisualization(userId = 1, fileSize: number | null = null) {
    return {
        id: 20,
        visualizationId: 'viz-uuid',
        name: 'myViz',
        description: 'desc',
        createdAt: new Date(),
        fileSize,
        objectKey: `users/${userId}/visualizations/viz-uuid`,
        user: buildUser(userId),
        matrix: { matrixId: 'matrix-uuid' },
    };
}

describe('VisualizationsService', () => {
    let service: VisualizationsService;
    let repo: ReturnType<typeof mockRepo>;
    let matricesService: ReturnType<typeof mockMatricesService>;
    let minioService: ReturnType<typeof mockMinioService>;
    let matrixRequestsService: ReturnType<typeof mockMatrixRequestsService>;
    let microserviceService: ReturnType<typeof mockMicroserviceService>;

    beforeEach(() => {
        repo = mockRepo();
        matricesService = mockMatricesService();
        minioService = mockMinioService();
        matrixRequestsService = mockMatrixRequestsService();
        microserviceService = mockMicroserviceService();
        service = new VisualizationsService(
            repo as any,
            matricesService as unknown as MatricesService,
            minioService as unknown as MinioService,
            matrixRequestsService as unknown as MatrixRequestsService,
            microserviceService as unknown as MicroserviceService,
        );
    });

    // ─── analyze ──────────────────────────────────────────────────────────────

    describe('analyze', () => {
        it('throws ForbiddenException when user does not own the matrix', async () => {
            matricesService.findOneByMatrixId.mockResolvedValue(buildMatrix(99, false));
            await expect(service.analyze(buildUser(1), 'matrix-uuid')).rejects.toThrow(ForbiddenException);
        });

        it('throws BusinessRuleViolationException when matrix already has a visualization', async () => {
            matricesService.findOneByMatrixId.mockResolvedValue(buildMatrix(1, true));
            await expect(service.analyze(buildUser(1), 'matrix-uuid')).rejects.toThrow(BusinessRuleViolationException);
        });

        it('throws ServiceUnavailableException when microservice call fails', async () => {
            matricesService.findOneByMatrixId.mockResolvedValue(buildMatrix(1, false));
            matrixRequestsService.create.mockResolvedValue({ id: 5 });
            microserviceService.triggerAnalysis.mockRejectedValue(new Error('network error'));
            matrixRequestsService.updateStatus.mockResolvedValue({});
            await expect(service.analyze(buildUser(1), 'matrix-uuid')).rejects.toThrow(ServiceUnavailableException);
        });

        it('marks the matrix request as FAILED when microservice throws', async () => {
            matricesService.findOneByMatrixId.mockResolvedValue(buildMatrix(1, false));
            matrixRequestsService.create.mockResolvedValue({ id: 5 });
            microserviceService.triggerAnalysis.mockRejectedValue(new Error('timeout'));
            matrixRequestsService.updateStatus.mockResolvedValue({});
            await expect(service.analyze(buildUser(1), 'matrix-uuid')).rejects.toThrow();
            expect(matrixRequestsService.updateStatus).toHaveBeenCalledWith(
                5,
                expect.objectContaining({ status: MatrixRequestStatus.FAILED }),
            );
        });

        it('returns a response with PENDING status on success', async () => {
            matricesService.findOneByMatrixId.mockResolvedValue(buildMatrix(1, false));
            matrixRequestsService.create.mockResolvedValue({ id: 5 });
            microserviceService.triggerAnalysis.mockResolvedValue({ taskId: 'queued:viz-uuid' });
            matrixRequestsService.addTaskId.mockResolvedValue(undefined);
            const viz = buildVisualization(1, null);
            repo.create.mockReturnValue(viz);
            repo.save.mockResolvedValue(viz);
            matricesService.updateVisualizationId.mockResolvedValue(undefined);

            const result = await service.analyze(buildUser(1), 'matrix-uuid');
            expect(result.status).toBe(MatrixRequestStatus.PENDING);
            expect(result.matrixRequestId).toBe(5);
        });
    });

    // ─── finalize ─────────────────────────────────────────────────────────────

    describe('finalize', () => {
        it('throws NotFoundException when visualization does not exist', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.finalize('missing', { fileSize: 1000, mimeType: 'text/plain' })).rejects.toThrow(
                NotFoundException,
            );
        });

        it('saves fileSize and mimeType on the visualization', async () => {
            const viz = buildVisualization(1, null);
            repo.findOneBy.mockResolvedValue(viz);
            repo.save.mockResolvedValue({ ...viz, fileSize: 5000 });
            const result = await service.finalize('viz-uuid', { fileSize: 5000, mimeType: 'text/plain' });
            expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ fileSize: 5000 }));
            expect(result.message).toContain('finalized');
        });
    });

    // ─── findAll ──────────────────────────────────────────────────────────────

    describe('findAll', () => {
        it('returns DTOs for all visualizations belonging to the user', async () => {
            repo.find.mockResolvedValue([buildVisualization(1, 1000)]);
            const result = await service.findAll(buildUser(1));
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('myViz');
        });
    });

    // ─── findOne ──────────────────────────────────────────────────────────────

    describe('findOne', () => {
        it('throws NotFoundException when visualization does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.findOne('missing', buildUser())).rejects.toThrow(NotFoundException);
        });

        it('throws ForbiddenException when user does not own the visualization', async () => {
            repo.findOne.mockResolvedValue(buildVisualization(99));
            await expect(service.findOne('viz-uuid', buildUser(1))).rejects.toThrow(ForbiddenException);
        });

        it('returns the detail DTO for the owner', async () => {
            repo.findOne.mockResolvedValue(buildVisualization(1, 1000));
            const result = await service.findOne('viz-uuid', buildUser(1));
            expect(result.name).toBe('myViz');
        });
    });

    // ─── update ───────────────────────────────────────────────────────────────

    describe('update', () => {
        it('throws NotFoundException when visualization does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.update('missing', {}, buildUser())).rejects.toThrow(NotFoundException);
        });

        it('throws ForbiddenException when user does not own the visualization', async () => {
            repo.findOne.mockResolvedValue(buildVisualization(99));
            await expect(service.update('viz-uuid', {}, buildUser(1))).rejects.toThrow(ForbiddenException);
        });

        it('throws BusinessRuleViolationException when new name is already taken', async () => {
            repo.findOne.mockResolvedValueOnce(buildVisualization(1));
            repo.findOne.mockResolvedValueOnce(buildVisualization(1)); // name exists
            await expect(service.update('viz-uuid', { name: 'takenName' }, buildUser(1))).rejects.toThrow(
                BusinessRuleViolationException,
            );
        });

        it('updates successfully when no conflicts', async () => {
            repo.findOne.mockResolvedValueOnce(buildVisualization(1));
            repo.findOne.mockResolvedValueOnce(null); // no name conflict
            repo.save.mockResolvedValue(buildVisualization(1));
            const result = await service.update('viz-uuid', { name: 'newName' }, buildUser(1));
            expect(result.message).toContain('updated successfully');
        });
    });

    // ─── remove ───────────────────────────────────────────────────────────────

    describe('remove', () => {
        it('throws NotFoundException when visualization does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.remove('missing', buildUser())).rejects.toThrow(NotFoundException);
        });

        it('throws ForbiddenException when user does not own the visualization', async () => {
            repo.findOne.mockResolvedValue(buildVisualization(99));
            await expect(service.remove('viz-uuid', buildUser(1))).rejects.toThrow(ForbiddenException);
        });

        it('deletes from MinIO and repository when owned', async () => {
            repo.findOne.mockResolvedValue(buildVisualization(1));
            repo.remove.mockResolvedValue({});
            const result = await service.remove('viz-uuid', buildUser(1));
            expect(minioService.deleteFile).toHaveBeenCalled();
            expect(repo.remove).toHaveBeenCalled();
            expect(result.message).toContain('removed successfully');
        });
    });

    // ─── getTreeUrl ───────────────────────────────────────────────────────────

    describe('getTreeUrl', () => {
        it('throws NotFoundException when visualization does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.getTreeUrl('missing', buildUser())).rejects.toThrow(NotFoundException);
        });

        it('throws ForbiddenException when user does not own the visualization', async () => {
            repo.findOne.mockResolvedValue(buildVisualization(99));
            await expect(service.getTreeUrl('viz-uuid', buildUser(1))).rejects.toThrow(ForbiddenException);
        });

        it('throws BusinessRuleViolationException when analysis is still in progress (no fileSize)', async () => {
            repo.findOne.mockResolvedValue(buildVisualization(1, null));
            await expect(service.getTreeUrl('viz-uuid', buildUser(1))).rejects.toThrow(BusinessRuleViolationException);
        });

        it('returns the presigned URL when visualization is ready', async () => {
            repo.findOne.mockResolvedValue(buildVisualization(1, 5000));
            const result = await service.getTreeUrl('viz-uuid', buildUser(1));
            expect(result.url).toBe('https://tree-url');
        });
    });

    // ─── objectKeyExists ──────────────────────────────────────────────────────

    describe('objectKeyExists', () => {
        it('returns false when no visualization has that object key', async () => {
            repo.findOneBy.mockResolvedValue(null);
            expect(await service.objectKeyExists('users/1/visualizations/xyz')).toBe(false);
        });

        it('returns true when a visualization has that object key', async () => {
            repo.findOneBy.mockResolvedValue(buildVisualization(1));
            expect(await service.objectKeyExists('users/1/visualizations/viz-uuid')).toBe(true);
        });
    });

    // ─── findVisualizationByVisualizationId / findOneByVisualizationId ────────

    describe('findVisualizationByVisualizationId', () => {
        it('throws NotFoundException when visualization is absent', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.findVisualizationByVisualizationId('missing')).rejects.toThrow(NotFoundException);
        });

        it('returns the visualization when found', async () => {
            const viz = buildVisualization(1);
            repo.findOneBy.mockResolvedValue(viz);
            const result = await service.findVisualizationByVisualizationId('viz-uuid');
            expect(result).toBe(viz);
        });
    });

    describe('findOneByVisualizationId', () => {
        it('throws NotFoundException when visualization is absent', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.findOneByVisualizationId('missing')).rejects.toThrow(NotFoundException);
        });

        it('returns the visualization entity when found', async () => {
            const viz = buildVisualization(1);
            repo.findOneBy.mockResolvedValue(viz);
            expect(await service.findOneByVisualizationId('viz-uuid')).toBe(viz);
        });
    });

    // ─── update — matrixId branch ─────────────────────────────────────────────

    describe('update — matrixId branch', () => {
        it('throws BusinessRuleViolationException when target matrix already has a different visualization', async () => {
            const currentViz = buildVisualization(1);
            const targetMatrix = {
                matrixId: 'target-matrix',
                visualization: { visualizationId: 'some-other-viz' }, // already has a different viz
            };
            repo.findOne
                .mockResolvedValueOnce(currentViz)                   // finds current visualization
                .mockResolvedValueOnce(null);                         // no name conflict
            matricesService.findOneByMatrixId.mockResolvedValue(targetMatrix);

            await expect(
                service.update('viz-uuid', { name: 'newName', matrixId: 'target-matrix' }, buildUser(1)),
            ).rejects.toThrow(BusinessRuleViolationException);
        });

        it('links a new matrix when the target matrix has no existing visualization', async () => {
            const currentViz = { ...buildVisualization(1), matrix: null };
            const targetMatrix = { matrixId: 'target-matrix', visualization: null };
            repo.findOne
                .mockResolvedValueOnce(currentViz)
                .mockResolvedValueOnce(null); // no name conflict
            matricesService.findOneByMatrixId.mockResolvedValue(targetMatrix);
            matricesService.updateVisualizationId.mockResolvedValue(undefined);
            repo.save.mockResolvedValue(currentViz);

            const result = await service.update(
                'viz-uuid',
                { matrixId: 'target-matrix' },
                buildUser(1),
            );
            expect(matricesService.updateVisualizationId).toHaveBeenCalled();
            expect(result.message).toContain('updated successfully');
        });
    });

    // ─── visualizationNameExists ──────────────────────────────────────────────

    describe('visualizationNameExists', () => {
        it('returns false when name is not taken', async () => {
            repo.findOne.mockResolvedValue(null);
            expect(await service.visualizationNameExists('newName', 1)).toBe(false);
        });

        it('returns true when name is already in use', async () => {
            repo.findOne.mockResolvedValue(buildVisualization(1));
            expect(await service.visualizationNameExists('myViz', 1)).toBe(true);
        });
    });

    // ─── countByUser / countAll ───────────────────────────────────────────────

    describe('countByUser', () => {
        it('returns the count for the given user', async () => {
            repo.count.mockResolvedValue(3);
            expect(await service.countByUser(1)).toBe(3);
        });
    });

    describe('countAll', () => {
        it('returns the global count', async () => {
            repo.count.mockResolvedValue(10);
            expect(await service.countAll()).toBe(10);
        });
    });
});
