import { NotFoundException } from '@nestjs/common';
import { MatrixRequestsService } from './matrix-requests.service';
import { MatrixRequest, MatrixRequestStatus } from './entities/matrix-request.entity';
import { User } from 'src/auth/users/entities/user.entity';
import { RoleName } from 'src/auth/roles/entities/role.entity';

const mockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
});

function buildUser(id = 1): User {
    return { id, email: 'u@test.com', role: { name: RoleName.RESEARCHER } } as unknown as User;
}

function buildRequest(id = 1, status = MatrixRequestStatus.PENDING): MatrixRequest {
    return {
        id,
        name: 'reqName',
        status,
        requestedAt: new Date(),
        matrix: { id: 10, user: buildUser() } as any,
    } as unknown as MatrixRequest;
}

describe('MatrixRequestsService', () => {
    let service: MatrixRequestsService;
    let repo: ReturnType<typeof mockRepo>;

    beforeEach(() => {
        repo = mockRepo();
        service = new MatrixRequestsService(repo as any);
    });

    describe('create', () => {
        it('creates a new MatrixRequest with PENDING status', async () => {
            const req = buildRequest();
            repo.create.mockReturnValue(req);
            repo.save.mockResolvedValue(req);
            const result = await service.create({ name: 'reqName', matrix: {} as any });
            expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ status: MatrixRequestStatus.PENDING }));
            expect(result).toBe(req);
        });
    });

    describe('findAll', () => {
        it('returns a mapped list of DTOs for the user', async () => {
            repo.find.mockResolvedValue([buildRequest()]);
            const result = await service.findAll(buildUser());
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('reqName');
        });
    });

    describe('findOne', () => {
        it('throws NotFoundException when request does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
        });

        it('returns the entity when found', async () => {
            const req = buildRequest();
            repo.findOne.mockResolvedValue(req);
            const result = await service.findOne(1);
            expect(result).toBe(req);
        });
    });

    describe('updateStatus', () => {
        it('throws NotFoundException when request does not exist', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.updateStatus(99, { status: MatrixRequestStatus.FAILED })).rejects.toThrow(
                NotFoundException,
            );
        });

        it('sets finishedAt when status is COMPLETED', async () => {
            const req = buildRequest();
            repo.findOne.mockResolvedValue(req);
            repo.save.mockResolvedValue({ ...req, status: MatrixRequestStatus.COMPLETED });
            await service.updateStatus(1, { status: MatrixRequestStatus.COMPLETED });
            expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: MatrixRequestStatus.COMPLETED }));
        });

        it('sets finishedAt when status is FAILED', async () => {
            const req = buildRequest();
            repo.findOne.mockResolvedValue(req);
            repo.save.mockResolvedValue(req);
            await service.updateStatus(1, { status: MatrixRequestStatus.FAILED, error: 'oops' });
            expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ error: 'oops' }));
        });

        it('does not set finishedAt for non-terminal statuses', async () => {
            const req = buildRequest();
            repo.findOne.mockResolvedValue(req);
            repo.save.mockResolvedValue(req);
            await service.updateStatus(1, { status: MatrixRequestStatus.PROCESSING });
            const saved = repo.save.mock.calls[0][0] as MatrixRequest;
            expect(saved.finishedAt).toBeUndefined();
        });

        it('uses the provided finishedAt timestamp when supplied', async () => {
            const req = buildRequest();
            repo.findOne.mockResolvedValue(req);
            repo.save.mockResolvedValue(req);
            const stamp = '2024-01-01T00:00:00.000Z';
            await service.updateStatus(1, { status: MatrixRequestStatus.COMPLETED, finishedAt: stamp });
            const saved = repo.save.mock.calls[0][0] as MatrixRequest;
            expect(saved.finishedAt?.toISOString()).toBe(new Date(stamp).toISOString());
        });
    });

    describe('addTaskId', () => {
        it('persists the task ID on the request', async () => {
            const req = buildRequest();
            repo.findOne.mockResolvedValue(req);
            repo.save.mockResolvedValue(req);
            await service.addTaskId(1, 'queued:viz-abc');
            expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ taskId: 'queued:viz-abc' }));
        });
    });

    describe('countToday', () => {
        it('returns the count from the repository', async () => {
            repo.count.mockResolvedValue(7);
            expect(await service.countToday()).toBe(7);
        });
    });

    describe('findActiveByUser', () => {
        it('returns PENDING and PROCESSING requests for the user', async () => {
            const requests = [
                buildRequest(1, MatrixRequestStatus.PENDING),
                buildRequest(2, MatrixRequestStatus.PROCESSING),
            ];
            repo.find.mockResolvedValue(requests);
            const result = await service.findActiveByUser(buildUser());
            expect(result).toHaveLength(2);
        });
    });

    describe('findFailedByUser', () => {
        it('returns only FAILED requests for the user', async () => {
            repo.find.mockResolvedValue([buildRequest(1, MatrixRequestStatus.FAILED)]);
            const result = await service.findFailedByUser(buildUser());
            expect(result[0].status).toBe(MatrixRequestStatus.FAILED);
        });
    });
});
