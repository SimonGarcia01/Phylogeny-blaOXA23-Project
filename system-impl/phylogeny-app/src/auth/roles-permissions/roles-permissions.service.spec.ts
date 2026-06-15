import { NotFoundException } from '@nestjs/common';
import { RolesPermissionsService } from './roles-permissions.service';
import { RolesService } from 'src/auth/roles/roles.service';
import { PermissionsService } from 'src/auth/permissions/permissions.service';
import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';

const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
});

const mockRolesService = () => ({ ensureExists: jest.fn(), findOne: jest.fn() });
const mockPermissionsService = () => ({ ensureExists: jest.fn(), findOne: jest.fn() });

function buildMapping(id = 1) {
    return {
        id,
        role: { id: 1, name: 'Researcher' },
        permission: { id: 1, name: 'MATRICES_READ' },
    };
}

describe('RolesPermissionsService', () => {
    let service: RolesPermissionsService;
    let repo: ReturnType<typeof mockRepo>;
    let rolesService: ReturnType<typeof mockRolesService>;
    let permissionsService: ReturnType<typeof mockPermissionsService>;

    beforeEach(() => {
        repo = mockRepo();
        rolesService = mockRolesService();
        permissionsService = mockPermissionsService();
        service = new RolesPermissionsService(
            repo as any,
            rolesService as unknown as RolesService,
            permissionsService as unknown as PermissionsService,
        );
    });

    describe('create', () => {
        it('throws DbIntegrityException when mapping already exists', async () => {
            rolesService.ensureExists.mockResolvedValue(undefined);
            permissionsService.ensureExists.mockResolvedValue(undefined);
            repo.findOne.mockResolvedValue(buildMapping());
            await expect(service.create({ roleId: 1, permissionId: 1 })).rejects.toThrow(DbIntegrityException);
        });

        it('creates the mapping when it does not exist', async () => {
            rolesService.ensureExists.mockResolvedValue(undefined);
            permissionsService.ensureExists.mockResolvedValue(undefined);
            repo.findOne.mockResolvedValue(null);
            const mapping = buildMapping();
            repo.create.mockReturnValue(mapping);
            repo.save.mockResolvedValue(mapping);
            const result = await service.create({ roleId: 1, permissionId: 1 });
            expect(result.message).toContain('created successfully');
        });
    });

    describe('findAll', () => {
        it('returns mapped DTOs', async () => {
            repo.find.mockResolvedValue([buildMapping()]);
            const result = await service.findAll();
            expect(result).toHaveLength(1);
        });
    });

    describe('findOne', () => {
        it('throws NotFoundException when mapping is absent', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
        });

        it('returns the DTO when found', async () => {
            repo.findOne.mockResolvedValue(buildMapping());
            const result = await service.findOne(1);
            expect(result).toBeDefined();
        });
    });

    describe('update', () => {
        it('throws NotFoundException when mapping is absent', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.update(99, { roleId: 2 })).rejects.toThrow(NotFoundException);
        });

        it('throws DbIntegrityException when updated pair already exists under another mapping', async () => {
            repo.findOne
                .mockResolvedValueOnce(buildMapping(1))  // existing mapping
                .mockResolvedValueOnce(buildMapping(2)); // duplicate found
            await expect(service.update(1, { roleId: 1, permissionId: 1 })).rejects.toThrow(DbIntegrityException);
        });

        it('updates successfully when no duplicate exists', async () => {
            repo.findOne
                .mockResolvedValueOnce(buildMapping(1))
                .mockResolvedValueOnce(null);
            repo.save.mockResolvedValue(buildMapping());
            const result = await service.update(1, { roleId: 1, permissionId: 2 });
            expect(result.message).toContain('updated successfully');
        });
    });

    describe('remove', () => {
        it('throws NotFoundException when mapping is absent', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.remove(99)).rejects.toThrow(NotFoundException);
        });

        it('deletes the mapping when found', async () => {
            repo.findOne.mockResolvedValue(buildMapping());
            repo.delete.mockResolvedValue({});
            const result = await service.remove(1);
            expect(repo.delete).toHaveBeenCalledWith(1);
            expect(result.message).toContain('deleted successfully');
        });
    });

    describe('setPermissionsForRole', () => {
        it('replaces all permissions for the role', async () => {
            rolesService.ensureExists.mockResolvedValue(undefined);
            permissionsService.ensureExists.mockResolvedValue(undefined);
            repo.delete.mockResolvedValue({});
            repo.create.mockReturnValue({});
            repo.save.mockResolvedValue([]);
            const result = await service.setPermissionsForRole(1, { permissionIds: [1, 2] });
            expect(repo.delete).toHaveBeenCalledWith({ role: { id: 1 } });
            expect(result.message).toContain('updated successfully');
        });

        it('only deletes (clears) when empty permissionIds list is provided', async () => {
            rolesService.ensureExists.mockResolvedValue(undefined);
            repo.delete.mockResolvedValue({});
            await service.setPermissionsForRole(1, { permissionIds: [] });
            expect(repo.delete).toHaveBeenCalled();
            expect(repo.save).not.toHaveBeenCalled();
        });
    });
});
