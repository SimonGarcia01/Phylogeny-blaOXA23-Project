import { NotFoundException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';

const mockRepo = () => ({
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
});

function buildPermission(id = 1, name = 'MATRICES_READ') {
    return { id, name, description: 'desc' };
}

describe('PermissionsService', () => {
    let service: PermissionsService;
    let repo: ReturnType<typeof mockRepo>;

    beforeEach(() => {
        repo = mockRepo();
        service = new PermissionsService(repo as any);
    });

    describe('create', () => {
        it('throws DbIntegrityException when name already exists', async () => {
            repo.findOneBy.mockResolvedValue(buildPermission());
            await expect(service.create({ name: 'MATRICES_READ' })).rejects.toThrow(DbIntegrityException);
        });

        it('creates and saves a permission with a unique name', async () => {
            repo.findOneBy.mockResolvedValue(null);
            const perm = buildPermission();
            repo.create.mockReturnValue(perm);
            repo.save.mockResolvedValue(perm);
            const result = await service.create({ name: 'MATRICES_READ' });
            expect(result.message).toContain('MATRICES_READ');
        });
    });

    describe('count', () => {
        it('delegates to repository count', async () => {
            repo.count.mockResolvedValue(28);
            expect(await service.count()).toBe(28);
        });
    });

    describe('findAll', () => {
        it('returns mapped DTOs', async () => {
            repo.find.mockResolvedValue([buildPermission()]);
            const result = await service.findAll();
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('MATRICES_READ');
        });
    });

    describe('findOne', () => {
        it('throws NotFoundException when permission is absent', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
        });

        it('returns the DTO when found', async () => {
            repo.findOneBy.mockResolvedValue(buildPermission());
            const result = await service.findOne(1);
            expect(result.name).toBe('MATRICES_READ');
        });
    });

    describe('update', () => {
        it('throws NotFoundException when permission is absent', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.update(99, { name: 'NEW' })).rejects.toThrow(NotFoundException);
        });

        it('throws DbIntegrityException when new name conflicts with another permission', async () => {
            repo.findOneBy
                .mockResolvedValueOnce(buildPermission(1, 'OLD'))
                .mockResolvedValueOnce(buildPermission(2, 'NEW'));
            await expect(service.update(1, { name: 'NEW' })).rejects.toThrow(DbIntegrityException);
        });

        it('updates when no conflict exists', async () => {
            repo.findOneBy
                .mockResolvedValueOnce(buildPermission(1, 'OLD'))
                .mockResolvedValueOnce(null);
            repo.update.mockResolvedValue({});
            const result = await service.update(1, { name: 'NEW' });
            expect(result.message).toContain('updated successfully');
        });
    });

    describe('remove', () => {
        it('throws NotFoundException when permission is absent', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.remove(99)).rejects.toThrow(NotFoundException);
        });

        it('deletes the permission when found', async () => {
            repo.findOneBy.mockResolvedValue(buildPermission());
            repo.delete.mockResolvedValue({});
            const result = await service.remove(1);
            expect(repo.delete).toHaveBeenCalledWith(1);
            expect(result.message).toContain('deleted successfully');
        });
    });

    describe('ensureExists', () => {
        it('throws NotFoundException when permission does not exist', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.ensureExists(99)).rejects.toThrow(NotFoundException);
        });

        it('resolves without throwing when permission exists', async () => {
            repo.findOneBy.mockResolvedValue(buildPermission());
            await expect(service.ensureExists(1)).resolves.toBeUndefined();
        });
    });
});
