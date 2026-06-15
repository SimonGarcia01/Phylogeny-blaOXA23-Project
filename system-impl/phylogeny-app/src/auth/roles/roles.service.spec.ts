import { NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';
import { RoleName } from './entities/role.entity';

const mockRepo = () => ({
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
});

function buildRole(id = 1, name = RoleName.RESEARCHER) {
    return { id, name, description: 'desc' };
}

describe('RolesService', () => {
    let service: RolesService;
    let repo: ReturnType<typeof mockRepo>;

    beforeEach(() => {
        repo = mockRepo();
        service = new RolesService(repo as any);
    });

    describe('create', () => {
        it('throws DbIntegrityException when name already exists', async () => {
            repo.findOneBy.mockResolvedValue(buildRole());
            await expect(service.create({ name: RoleName.RESEARCHER })).rejects.toThrow(DbIntegrityException);
        });

        it('creates and saves a role with a unique name', async () => {
            repo.findOneBy.mockResolvedValue(null);
            const role = buildRole();
            repo.create.mockReturnValue(role);
            repo.save.mockResolvedValue(role);
            const result = await service.create({ name: RoleName.RESEARCHER });
            expect(result.message).toContain('Researcher');
        });
    });

    describe('count', () => {
        it('delegates to repository count', async () => {
            repo.count.mockResolvedValue(3);
            expect(await service.count()).toBe(3);
        });
    });

    describe('findAll', () => {
        it('returns mapped DTOs', async () => {
            repo.find.mockResolvedValue([buildRole()]);
            const result = await service.findAll();
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe(RoleName.RESEARCHER);
        });
    });

    describe('findOne', () => {
        it('throws NotFoundException when role is absent', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
        });

        it('returns DTO including permissions when found', async () => {
            const role = { ...buildRole(), rolesPermissions: [{ permission: { name: 'MATRICES_READ' } }] };
            repo.findOne.mockResolvedValue(role);
            const result = await service.findOne(1);
            expect(result.permissions).toContain('MATRICES_READ');
        });
    });

    describe('update', () => {
        it('throws NotFoundException when role is absent', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.update(99, { name: RoleName.ADMIN })).rejects.toThrow(NotFoundException);
        });

        it('throws DbIntegrityException when new name conflicts with another role', async () => {
            repo.findOneBy
                .mockResolvedValueOnce(buildRole(1, RoleName.RESEARCHER)) // existing role
                .mockResolvedValueOnce(buildRole(2, RoleName.ADMIN));      // conflicting role
            await expect(service.update(1, { name: RoleName.ADMIN })).rejects.toThrow(DbIntegrityException);
        });

        it('successfully updates when no conflict', async () => {
            repo.findOneBy.mockResolvedValue(buildRole());
            repo.update.mockResolvedValue({});
            const result = await service.update(1, { description: 'new desc' });
            expect(result.message).toContain('updated successfully');
        });
    });

    describe('remove', () => {
        it('throws NotFoundException when role is absent', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.remove(99)).rejects.toThrow(NotFoundException);
        });

        it('deletes the role when found', async () => {
            repo.findOneBy.mockResolvedValue(buildRole());
            repo.delete.mockResolvedValue({});
            const result = await service.remove(1);
            expect(repo.delete).toHaveBeenCalledWith(1);
            expect(result.message).toContain('deleted successfully');
        });
    });

    describe('findOneByName', () => {
        it('throws NotFoundException when role name is absent', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.findOneByName(RoleName.ADMIN)).rejects.toThrow(NotFoundException);
        });

        it('returns the role entity when found', async () => {
            const role = buildRole(2, RoleName.ADMIN);
            repo.findOneBy.mockResolvedValue(role);
            const result = await service.findOneByName(RoleName.ADMIN);
            expect(result).toBe(role);
        });
    });

    describe('ensureExists', () => {
        it('throws NotFoundException when role does not exist', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.ensureExists(99)).rejects.toThrow(NotFoundException);
        });

        it('resolves without throwing when role exists', async () => {
            repo.findOneBy.mockResolvedValue(buildRole());
            await expect(service.ensureExists(1)).resolves.toBeUndefined();
        });
    });
});
