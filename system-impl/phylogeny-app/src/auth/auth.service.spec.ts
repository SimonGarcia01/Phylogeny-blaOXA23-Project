import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from './users/users.service';
import { RolesService } from './roles/roles.service';
import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';
import { RoleName } from './roles/entities/role.entity';
import { User } from './users/entities/user.entity';

jest.mock('bcrypt');

const mockUserRepository = () => ({ create: jest.fn(), save: jest.fn() });
const mockUsersService = () => ({ findByEmail: jest.fn(), findOneUser: jest.fn() });
const mockJwtService = () => ({ sign: jest.fn().mockReturnValue('signed-token') });
const mockRolesService = () => ({ findOneByName: jest.fn() });
const mockConfigService = () => ({ get: jest.fn().mockReturnValue('10') });

function buildRole(permissions: string[] = ['MATRICES_READ']) {
    return {
        id: 1,
        name: RoleName.RESEARCHER,
        rolesPermissions: permissions.map((name) => ({ permission: { name } })),
    };
}

function buildUser(overrides = {}): User {
    return {
        id: 1,
        email: 'user@test.com',
        firstName: 'Alice',
        lastName: 'Smith',
        encryptedPassword: 'hashed',
        role: buildRole(),
        ...overrides,
    } as unknown as User;
}

describe('AuthService', () => {
    let service: AuthService;
    let usersService: ReturnType<typeof mockUsersService>;
    let jwtService: ReturnType<typeof mockJwtService>;
    let rolesService: ReturnType<typeof mockRolesService>;
    let configService: ReturnType<typeof mockConfigService>;
    let userRepository: ReturnType<typeof mockUserRepository>;

    beforeEach(() => {
        usersService = mockUsersService();
        jwtService = mockJwtService();
        rolesService = mockRolesService();
        configService = mockConfigService();
        userRepository = mockUserRepository();

        service = new AuthService(
            userRepository as any,
            usersService as unknown as UsersService,
            jwtService as unknown as JwtService,
            rolesService as unknown as RolesService,
            configService as unknown as ConfigService,
        );

        jest.clearAllMocks();
    });

    // ─── validateUser ────────────────────────────────────────────────────────────

    describe('validateUser', () => {
        it('throws NotFoundException when email is not found', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            await expect(service.validateUser('x@x.com', 'pass')).rejects.toThrow(NotFoundException);
        });

        it('throws UnauthorizedException when password does not match', async () => {
            usersService.findByEmail.mockResolvedValue(buildUser());
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await expect(service.validateUser('user@test.com', 'wrong')).rejects.toThrow(UnauthorizedException);
        });

        it('returns the user when credentials are valid', async () => {
            const user = buildUser();
            usersService.findByEmail.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            const result = await service.validateUser('user@test.com', 'correct');
            expect(result).toBe(user);
        });
    });

    // ─── login ────────────────────────────────────────────────────────────────────

    describe('login', () => {
        it('returns an access token and a user DTO on successful login', async () => {
            const user = buildUser();
            usersService.findByEmail.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login({ email: 'user@test.com', password: 'correct' });

            expect(result.token).toBe('signed-token');
            expect(result.user.email).toBe('user@test.com');
        });

        it('includes permissions in the JWT payload', async () => {
            const user = buildUser();
            usersService.findByEmail.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await service.login({ email: 'user@test.com', password: 'correct' });

            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ permissions: ['MATRICES_READ'] }),
            );
        });
    });

    // ─── signup ───────────────────────────────────────────────────────────────────

    describe('signup', () => {
        it('throws DbIntegrityException when email already exists', async () => {
            usersService.findByEmail.mockResolvedValue(buildUser());
            await expect(
                service.signup({ email: 'user@test.com', password: 'pass', firstName: 'A', lastName: 'B' }),
            ).rejects.toThrow(DbIntegrityException);
        });

        it('creates a new user and returns a token on fresh email', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
            rolesService.findOneByName.mockResolvedValue(buildRole());
            const savedUser = buildUser();
            userRepository.create.mockReturnValue(savedUser);
            userRepository.save.mockResolvedValue(savedUser);
            usersService.findOneUser.mockResolvedValue(savedUser);

            const result = await service.signup({
                email: 'new@test.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User',
            });

            expect(result.token).toBe('signed-token');
            expect(rolesService.findOneByName).toHaveBeenCalledWith(RoleName.RESEARCHER);
        });

        it('falls back to 10 salt rounds when SALT_ROUNDS is not configured', async () => {
            configService.get.mockReturnValue(undefined);
            usersService.findByEmail.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
            rolesService.findOneByName.mockResolvedValue(buildRole());
            const savedUser = buildUser();
            userRepository.create.mockReturnValue(savedUser);
            userRepository.save.mockResolvedValue(savedUser);
            usersService.findOneUser.mockResolvedValue(savedUser);

            await service.signup({ email: 'new@test.com', password: 'plain', firstName: 'A', lastName: 'B' });

            // parseInt(undefined ?? '10') = 10
            expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
        });

        it('hashes the password before saving', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
            rolesService.findOneByName.mockResolvedValue(buildRole());
            const savedUser = buildUser();
            userRepository.create.mockReturnValue(savedUser);
            userRepository.save.mockResolvedValue(savedUser);
            usersService.findOneUser.mockResolvedValue(savedUser);

            await service.signup({ email: 'new@test.com', password: 'plain', firstName: 'A', lastName: 'B' });

            expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
        });
    });
});
