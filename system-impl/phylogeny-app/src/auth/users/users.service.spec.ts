import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { RolesService } from '../roles/roles.service';
import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';
import { User } from './entities/user.entity';
import { RoleName } from '../roles/entities/role.entity';

jest.mock('bcrypt');

const mockRepo = () => ({
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
});

const mockConfigService = () => ({ get: jest.fn().mockReturnValue('10') });
const mockRolesService = () => ({ findOneByName: jest.fn() });

function buildRole() {
    return { id: 1, name: RoleName.RESEARCHER };
}

function buildUser(id = 1): User {
    return { id, email: 'u@test.com', firstName: 'A', lastName: 'B', role: buildRole() } as unknown as User;
}

describe('UsersService', () => {
    let service: UsersService;
    let repo: ReturnType<typeof mockRepo>;
    let rolesService: ReturnType<typeof mockRolesService>;

    beforeEach(() => {
        repo = mockRepo();
        rolesService = mockRolesService();
        service = new UsersService(
            repo as any,
            mockConfigService() as unknown as ConfigService,
            rolesService as unknown as RolesService,
        );
    });

    describe('create', () => {
        it('throws DbIntegrityException when email already exists', async () => {
            repo.findOne.mockResolvedValue(buildUser());
            await expect(
                service.create({ email: 'u@test.com', password: 'pw', firstName: 'A', lastName: 'B', role: RoleName.RESEARCHER }),
            ).rejects.toThrow(DbIntegrityException);
        });

        it('creates and saves a new user when email is free', async () => {
            repo.findOne.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
            rolesService.findOneByName.mockResolvedValue(buildRole());
            const newUser = { ...buildUser(), email: 'new@test.com' };
            repo.create.mockReturnValue(newUser);
            repo.save.mockResolvedValue(newUser);

            const result = await service.create({
                email: 'new@test.com', password: 'pw', firstName: 'A', lastName: 'B', role: RoleName.RESEARCHER,
            });

            expect(result.message).toContain('new@test.com');
        });
    });

    describe('count', () => {
        it('returns the count from the repository', async () => {
            repo.count.mockResolvedValue(5);
            expect(await service.count()).toBe(5);
        });
    });

    describe('findAll', () => {
        it('returns a mapped array of ResponseUserDto', async () => {
            repo.find.mockResolvedValue([buildUser()]);
            const result = await service.findAll();
            expect(result).toHaveLength(1);
            expect(result[0].email).toBe('u@test.com');
        });
    });

    describe('findOneDto', () => {
        it('throws NotFoundException when user is absent', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.findOneDto(999)).rejects.toThrow(NotFoundException);
        });

        it('returns the DTO when user is found', async () => {
            repo.findOne.mockResolvedValue(buildUser());
            const result = await service.findOneDto(1);
            expect(result.email).toBe('u@test.com');
        });
    });

    describe('findOneUser', () => {
        it('throws NotFoundException when user is absent', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(service.findOneUser(999)).rejects.toThrow(NotFoundException);
        });

        it('returns the full entity when found', async () => {
            const user = buildUser();
            repo.findOne.mockResolvedValue(user);
            const result = await service.findOneUser(1);
            expect(result).toBe(user);
        });
    });

    describe('findByEmail', () => {
        it('returns null when no user matches', async () => {
            repo.findOne.mockResolvedValue(null);
            expect(await service.findByEmail('unknown@test.com')).toBeNull();
        });

        it('returns the user when found', async () => {
            const user = buildUser();
            repo.findOne.mockResolvedValue(user);
            const result = await service.findByEmail('u@test.com');
            expect(result).toBe(user);
        });
    });

    describe('update', () => {
        it('throws NotFoundException when user does not exist', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.update(999, { firstName: 'X' })).rejects.toThrow(NotFoundException);
        });

        it('updates without changing role when role field is absent', async () => {
            repo.findOneBy.mockResolvedValue(buildUser());
            repo.update.mockResolvedValue({});
            const result = await service.update(1, { firstName: 'Updated' });
            expect(repo.update).toHaveBeenCalled();
            expect(result.message).toContain('updated successfully');
        });

        it('looks up the new role when role is being changed', async () => {
            repo.findOneBy.mockResolvedValue(buildUser());
            rolesService.findOneByName.mockResolvedValue(buildRole());
            repo.update.mockResolvedValue({});
            await service.update(1, { role: RoleName.ADMIN });
            expect(rolesService.findOneByName).toHaveBeenCalledWith(RoleName.ADMIN);
        });
    });

    describe('remove', () => {
        it('throws NotFoundException when user does not exist', async () => {
            repo.findOneBy.mockResolvedValue(null);
            await expect(service.remove(999)).rejects.toThrow(NotFoundException);
        });

        it('soft-deletes the user when found', async () => {
            repo.findOneBy.mockResolvedValue(buildUser());
            repo.softDelete.mockResolvedValue({});
            const result = await service.remove(1);
            expect(repo.softDelete).toHaveBeenCalledWith(1);
            expect(result.message).toContain('deactivated');
        });
    });
});
