import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';

// ─── Mock AuthService ────────────────────────────────────────────────────────

const authServiceMock = {
    login: jest.fn(),
    signup: jest.fn(),
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Auth endpoints (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: authServiceMock }],
        }).compile();

        app = module.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
        );
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    // ─── POST /auth/login ────────────────────────────────────────────────────

    describe('POST /auth/login', () => {
        it('returns 201 with token when credentials are valid', async () => {
            authServiceMock.login.mockResolvedValue({
                token: 'jwt-token',
                user: { email: 'test@example.com', firstName: 'Alice', lastName: 'Smith', role: 'Researcher' },
            });

            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'test@example.com', password: 'password1' })
                .expect(201);

            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe('test@example.com');
        });

        it('returns 400 when email is missing', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({ password: 'password1' })
                .expect(400);
        });

        it('returns 400 when email format is invalid', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'not-an-email', password: 'password1' })
                .expect(400);
        });

        it('returns 400 when password is missing', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'test@example.com' })
                .expect(400);
        });

        it('returns 400 when unknown fields are included', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'test@example.com', password: 'pw123456', extra: 'field' })
                .expect(400);
        });

        it('propagates service errors (e.g. 404 for unknown email)', async () => {
            authServiceMock.login.mockRejectedValue(new NotFoundException('User not found'));
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'unknown@x.com', password: 'password1' })
                .expect(404);
        });
    });

    // ─── POST /auth/signup ───────────────────────────────────────────────────

    describe('POST /auth/signup', () => {
        it('returns 201 with token on successful registration', async () => {
            authServiceMock.signup.mockResolvedValue({
                token: 'jwt-token',
                user: { email: 'new@example.com', firstName: 'Bob', lastName: 'Jones', role: 'Researcher' },
            });

            const response = await request(app.getHttpServer())
                .post('/auth/signup')
                .send({ email: 'new@example.com', password: 'password1', firstName: 'Bob', lastName: 'Jones' })
                .expect(201);

            expect(response.body).toHaveProperty('token');
        });

        it('returns 409 when email is already registered', async () => {
            authServiceMock.signup.mockRejectedValue(
                new DbIntegrityException('A user with the provided email already exists.'),
            );

            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({ email: 'exists@example.com', password: 'password1', firstName: 'A', lastName: 'B' })
                .expect(409);
        });

        it('returns 400 when password is too short (< 8 chars)', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({ email: 'x@x.com', password: 'short', firstName: 'A', lastName: 'B' })
                .expect(400);
        });

        it('returns 400 when password is too long (> 30 chars)', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({ email: 'x@x.com', password: 'a'.repeat(31), firstName: 'A', lastName: 'B' })
                .expect(400);
        });

        it('returns 400 when firstName is missing', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({ email: 'x@x.com', password: 'password1', lastName: 'B' })
                .expect(400);
        });

        it('returns 400 when firstName exceeds 20 characters', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({ email: 'x@x.com', password: 'password1', firstName: 'A'.repeat(21), lastName: 'B' })
                .expect(400);
        });

        it('returns 400 when unknown fields are present', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({ email: 'x@x.com', password: 'password1', firstName: 'A', lastName: 'B', extra: 'field' })
                .expect(400);
        });
    });
});
