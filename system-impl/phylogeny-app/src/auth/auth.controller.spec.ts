import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';

const mockAuthService = () => ({
    login: jest.fn(),
    signup: jest.fn(),
});

const fakeResponse = (): AuthResponseDto =>
    ({ token: 'test-token', user: { email: 'u@test.com' } } as unknown as AuthResponseDto);

describe('AuthController', () => {
    let controller: AuthController;
    let authService: ReturnType<typeof mockAuthService>;

    beforeEach(() => {
        authService = mockAuthService();
        controller = new AuthController(authService as unknown as AuthService);
    });

    describe('login', () => {
        it('delegates to AuthService.login and returns the result', async () => {
            authService.login.mockResolvedValue(fakeResponse());
            const dto = { email: 'u@test.com', password: 'pw' };
            const result = await controller.login(dto);
            expect(authService.login).toHaveBeenCalledWith(dto);
            expect(result.token).toBe('test-token');
        });
    });

    describe('signup', () => {
        it('delegates to AuthService.signup and returns the result', async () => {
            authService.signup.mockResolvedValue(fakeResponse());
            const dto = { email: 'u@test.com', password: 'pw', firstName: 'A', lastName: 'B' };
            const result = await controller.signup(dto);
            expect(authService.signup).toHaveBeenCalledWith(dto);
            expect(result.token).toBe('test-token');
        });
    });
});
