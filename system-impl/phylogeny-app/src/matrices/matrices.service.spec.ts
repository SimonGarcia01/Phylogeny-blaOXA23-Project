import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MatricesService } from './matrices.service';
import { MinioService } from 'src/common/utils/minio/minio.service';
import { VisualizationsService } from 'src/visualizations/visualizations.service';
import { BusinessRuleViolationException } from 'src/common/exceptions/business-rule-violation-exception';
import { User } from 'src/auth/users/entities/user.entity';
import { RoleName } from 'src/auth/roles/entities/role.entity';

const mockRepo = () => ({
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
});

const mockMinioService = () => ({
    generatePresignedPutUrl: jest.fn().mockResolvedValue('https://presigned-url'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    matrixBucketName: 'matrices',
    visualizationBucketName: 'visualizations',
});

const mockVisualizationsService = () => ({
    findVisualizationByVisualizationId: jest.fn(),
});

function buildUser(id = 1): User {
    return { id, email: 'u@test.com', role: { name: RoleName.RESEARCHER } } as unknown as User;
}

function buildMatrix(matrixId = 'uuid-123', userId = 1) {
    return {
        matrixId,
        name: 'myMatrix',
        description: 'desc',
        uploadedAt: new Date(),
        fileSize: 1000,
        objectKey: `users/${userId}/matrices/${matrixId}`,
        user: buildUser(userId),
        visualization: null,
    };
}

describe('MatricesService', () => {
    let service: MatricesService;
    let repo: ReturnType<typeof mockRepo>;
    let minioService: ReturnType<typeof mockMinioService>;
    let visualizationsService: ReturnType<typeof mockVisualizationsService>;

    beforeEach(() => {
        repo = mockRepo();
        minioService = mockMinioService();
        visualizationsService = mockVisualizationsService();
        service = new MatricesService(
            repo as any,
            minioService as unknown as MinioService,
            visualizationsService as unknown as VisualizationsService,
        );
    });

    // ─── generateUploadUrl ────────────────────────────────────────────────────

    describe('generateUploadUrl', () => {
        const validDto = { fileName: 'data.nex', fileSize: 1024, fileType: '.nex' };

        it('throws BadRequestException when file exceeds 10 MB', async () => {
            const dto = { ...validDto, fileSize: 11 * 1024 * 1024 };
            await expect(service.generateUploadUrl(buildUser(), dto)).rejects.toThrow(BadRequestException);
        });

        it('throws BusinessRuleViolationException when matrix name already exists for user', async () => {
            repo.findOne.mockResolvedValue(buildMatrix()); // name exists
            await expect(service.generateUploadUrl(buildUser(), validDto)).rejects.toThrow(
                BusinessRuleViolationException,
            );
        });

        it('throws BusinessRuleViolationException when file type is not .nex', async () => {
            repo.findOne.mockResolvedValue(null); // no name conflict
            const dto = { ...validDto, fileType: '.fasta' };
            await expect(service.generateUploadUrl(buildUser(), dto)).rejects.toThrow(BusinessRuleViolationException);
        });

        it('returns a presigned URL with a UUID object key', async () => {
            repo.findOne
                .mockResolvedValueOnce(null) // matrixNameExists
                .mockResolvedValueOnce(null); // objectKeyExists
            const result = await service.generateUploadUrl(buildUser(), validDto);
            expect(result.uploadUrl).toBe('https://presigned-url');
            expect(result.objectKey).toMatch(/^users\/1\/matrices\//);
        });
    });

    // ─── create ───────────────────────────────────────────────────────────────

    describe('create', () => {
        it('saves a new matrix and returns a success message', async () => {
            const matrix = buildMatrix();
            repo.create.mockReturnValue(matrix);
            repo.save.mockResolvedValue(matrix);
            const dto = { name: 'myMatrix', matrixId: 'uuid-123', objectKey: 'key', fileSize: 100 };
            const result = await service.create(buildUser(), dto);
            expect(result.message).toContain('myMatrix');
        });
    });

    // ─── findAll ──────────────────────────────────────────────────────────────

    describe('findAll', () => {
        it('returns only matrices belonging to the requesting user', async () => {
            repo.find.mockResolvedValue([buildMatrix()]);
            const result = await service.findAll(buildUser());
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('myMatrix');
        });
    });

    // ─── findOne ──────────────────────────────────────────────────────────────

    describe('findOne', () => {
        it('throws NotFoundException when matrix does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.findOne('missing', buildUser())).rejects.toThrow(NotFoundException);
        });

        it('throws ForbiddenException when user does not own the matrix', async () => {
            repo.findOne.mockResolvedValue(buildMatrix('uuid-1', 99)); // owner id = 99
            await expect(service.findOne('uuid-1', buildUser(1))).rejects.toThrow(ForbiddenException);
        });

        it('returns the detail DTO for the owner', async () => {
            repo.findOne.mockResolvedValue(buildMatrix('uuid-1', 1));
            const result = await service.findOne('uuid-1', buildUser(1));
            expect(result.name).toBe('myMatrix');
        });
    });

    // ─── update ───────────────────────────────────────────────────────────────

    describe('update', () => {
        it('throws NotFoundException when matrix does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.update('missing', {}, buildUser())).rejects.toThrow(NotFoundException);
        });

        it('throws ForbiddenException when user does not own the matrix', async () => {
            repo.findOne.mockResolvedValue(buildMatrix('uuid-1', 99));
            await expect(service.update('uuid-1', {}, buildUser(1))).rejects.toThrow(ForbiddenException);
        });

        it('throws BusinessRuleViolationException when new name is already taken', async () => {
            repo.findOne
                .mockResolvedValueOnce(buildMatrix('uuid-1', 1)) // matrix exists and is owned
                .mockResolvedValueOnce(buildMatrix('other-uuid', 1)); // name conflict
            await expect(service.update('uuid-1', { name: 'otherName' }, buildUser(1))).rejects.toThrow(
                BusinessRuleViolationException,
            );
        });

        it('updates when no conflict', async () => {
            repo.findOne
                .mockResolvedValueOnce(buildMatrix('uuid-1', 1))
                .mockResolvedValueOnce(null); // no name conflict
            repo.update.mockResolvedValue({});
            const result = await service.update('uuid-1', { name: 'newName' }, buildUser(1));
            expect(result.message).toContain('updated successfully');
        });
    });

    // ─── remove ───────────────────────────────────────────────────────────────

    describe('remove', () => {
        it('throws NotFoundException when matrix does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.remove('missing', buildUser())).rejects.toThrow(NotFoundException);
        });

        it('throws ForbiddenException when user does not own the matrix', async () => {
            repo.findOne.mockResolvedValue(buildMatrix('uuid-1', 99));
            await expect(service.remove('uuid-1', buildUser(1))).rejects.toThrow(ForbiddenException);
        });

        it('deletes from MinIO and repository when owned', async () => {
            repo.findOne.mockResolvedValue(buildMatrix('uuid-1', 1));
            repo.remove.mockResolvedValue({});
            const result = await service.remove('uuid-1', buildUser(1));
            expect(minioService.deleteFile).toHaveBeenCalled();
            expect(repo.remove).toHaveBeenCalled();
            expect(result.message).toContain('removed successfully');
        });
    });

    // ─── countByUser / countAll ───────────────────────────────────────────────

    describe('countByUser', () => {
        it('returns the count for the given user', async () => {
            repo.count.mockResolvedValue(4);
            expect(await service.countByUser(1)).toBe(4);
        });
    });

    describe('countAll', () => {
        it('returns the global count', async () => {
            repo.count.mockResolvedValue(20);
            expect(await service.countAll()).toBe(20);
        });
    });

    // ─── updateVisualizationId ────────────────────────────────────────────────

    describe('updateVisualizationId', () => {
        it('throws NotFoundException when matrix does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.updateVisualizationId('uuid-1', 'viz-1')).rejects.toThrow(NotFoundException);
        });

        it('throws BusinessRuleViolationException when matrix already has a different visualization', async () => {
            const matrix = buildMatrix('uuid-1', 1);
            matrix.visualization = { visualizationId: 'OTHER-VIZ' } as any;
            repo.findOne.mockResolvedValue(matrix);
            await expect(service.updateVisualizationId('uuid-1', 'viz-1')).rejects.toThrow(
                BusinessRuleViolationException,
            );
        });

        it('does nothing when matrix already references the same visualization (idempotent re-link)', async () => {
            const matrix = buildMatrix('uuid-1', 1);
            matrix.visualization = { visualizationId: 'viz-1' } as any;
            repo.findOne
                .mockResolvedValueOnce(matrix)       // find matrix — has existing viz
                .mockResolvedValueOnce(null);         // no other matrix linked to this viz
            visualizationsService.findVisualizationByVisualizationId.mockResolvedValue({ visualizationId: 'viz-1' });
            repo.save.mockResolvedValue(matrix);
            // same vizId passed → no BusinessRuleViolationException
            await expect(service.updateVisualizationId('uuid-1', 'viz-1')).resolves.toBeUndefined();
        });

        it('throws BusinessRuleViolationException when visualization is already linked to another matrix', async () => {
            const matrix = buildMatrix('uuid-1', 1);
            const otherMatrix = buildMatrix('other-uuid', 1);
            repo.findOne
                .mockResolvedValueOnce(matrix)       // find matrix
                .mockResolvedValueOnce(otherMatrix);  // find linked matrix
            visualizationsService.findVisualizationByVisualizationId.mockResolvedValue({ visualizationId: 'viz-1' });
            await expect(service.updateVisualizationId('uuid-1', 'viz-1')).rejects.toThrow(
                BusinessRuleViolationException,
            );
        });

        it('links visualization to matrix when no conflicts exist', async () => {
            const matrix = buildMatrix('uuid-1', 1);
            repo.findOne
                .mockResolvedValueOnce(matrix)  // find matrix
                .mockResolvedValueOnce(null);   // no other matrix linked to this viz
            visualizationsService.findVisualizationByVisualizationId.mockResolvedValue({ visualizationId: 'viz-1' });
            repo.save.mockResolvedValue({ ...matrix, visualization: { visualizationId: 'viz-1' } });
            await expect(service.updateVisualizationId('uuid-1', 'viz-1')).resolves.toBeUndefined();
            expect(repo.save).toHaveBeenCalled();
        });
    });
});
