import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { SeedService } from './seed.service';
import { RoleName } from 'src/auth/roles/entities/role.entity';

jest.mock('bcrypt');

const mockRoleRepo = () => ({
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
});

const mockPermissionRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
});

const mockRolesPermissionRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
});

const mockUserRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
});

const mockConfigService = () => ({
    get: jest.fn().mockReturnValue('1'),
});

function buildRole(name: RoleName, id = 1) {
    return { id, name };
}

function buildPermission(name: string, id = 1) {
    return { id, name };
}

describe('SeedService', () => {
    let service: SeedService;
    let roleRepo: ReturnType<typeof mockRoleRepo>;
    let permissionRepo: ReturnType<typeof mockPermissionRepo>;
    let rolesPermissionRepo: ReturnType<typeof mockRolesPermissionRepo>;
    let userRepo: ReturnType<typeof mockUserRepo>;

    beforeEach(() => {
        roleRepo = mockRoleRepo();
        permissionRepo = mockPermissionRepo();
        rolesPermissionRepo = mockRolesPermissionRepo();
        userRepo = mockUserRepo();

        service = new SeedService(
            roleRepo as any,
            permissionRepo as any,
            rolesPermissionRepo as any,
            userRepo as any,
            mockConfigService() as unknown as ConfigService,
        );
    });

    describe('seed', () => {
        it('returns early with a message when seed has already been applied', async () => {
            roleRepo.findOneBy.mockResolvedValue(buildRole(RoleName.ADMIN));
            const result = await service.seed();
            expect(result.message).toContain('already applied');
            expect(permissionRepo.create).not.toHaveBeenCalled();
        });

        it('creates 28 permissions (7 entities × 4 actions) on a fresh database', async () => {
            roleRepo.findOneBy.mockResolvedValue(null);

            const savedPermissions = Array.from({ length: 28 }, (_, i) => ({
                id: i + 1,
                name: `ENTITY_${i}_ACTION`,
            }));
            permissionRepo.create.mockReturnValue(savedPermissions);
            permissionRepo.save.mockResolvedValue(savedPermissions);

            const adminRole = buildRole(RoleName.ADMIN, 1);
            const researcherRole = buildRole(RoleName.RESEARCHER, 2);
            roleRepo.create
                .mockReturnValueOnce(adminRole)
                .mockReturnValueOnce(researcherRole);
            roleRepo.save.mockResolvedValue([adminRole, researcherRole]);

            rolesPermissionRepo.create.mockImplementation((x) => x);
            rolesPermissionRepo.save.mockResolvedValue([]);

            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
            userRepo.create.mockImplementation((x) => x);
            userRepo.save.mockResolvedValue([]);

            const result = await service.seed();

            expect(permissionRepo.create).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ name: expect.stringContaining('_') })]),
            );
            // The array passed to permissionRepo.create should have 28 entries
            const permissionsArg = (permissionRepo.create as jest.Mock).mock.calls[0][0];
            expect(permissionsArg).toHaveLength(28);
            expect(result.message).toContain('seeded successfully');
        });

        it('creates an admin user with an encrypted password', async () => {
            roleRepo.findOneBy.mockResolvedValue(null);

            const savedPermissions = Array.from({ length: 28 }, (_, i) => ({ id: i + 1, name: `E_${i}_A` }));
            permissionRepo.create.mockReturnValue(savedPermissions);
            permissionRepo.save.mockResolvedValue(savedPermissions);

            const adminRole = buildRole(RoleName.ADMIN, 1);
            const researcherRole = buildRole(RoleName.RESEARCHER, 2);
            roleRepo.create.mockReturnValueOnce(adminRole).mockReturnValueOnce(researcherRole);
            roleRepo.save.mockResolvedValue([adminRole, researcherRole]);

            rolesPermissionRepo.create.mockImplementation((x) => x);
            rolesPermissionRepo.save.mockResolvedValue([]);

            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
            userRepo.create.mockImplementation((x) => x);
            userRepo.save.mockResolvedValue([]);

            await service.seed();

            expect(bcrypt.hash).toHaveBeenCalledWith('Admin123', 1);
            expect(userRepo.save).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ email: 'admin@example.com' }),
                ]),
            );
        });
    });
});
