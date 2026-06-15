import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException, ForbiddenException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { MatricesController } from 'src/matrices/matrices.controller';
import { MatricesService } from 'src/matrices/matrices.service';
import { BusinessRuleViolationException } from 'src/common/exceptions/business-rule-violation-exception';
import { User } from 'src/auth/users/entities/user.entity';
import { RoleName } from 'src/auth/roles/entities/role.entity';

// ─── Constants ───────────────────────────────────────────────────────────────

const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_OBJECT_KEY = `users/1/matrices/${TEST_UUID}`; // exactly 53 chars

// ─── Fake user injected via guard bypass ─────────────────────────────────────

function buildUser(id = 1): User {
    return {
        id,
        email: 'u@test.com',
        firstName: 'Alice',
        lastName: 'Smith',
        role: {
            name: RoleName.RESEARCHER,
            rolesPermissions: [
                { permission: { name: 'MATRICES_READ' } },
                { permission: { name: 'MATRICES_CREATE' } },
                { permission: { name: 'MATRICES_UPDATE' } },
                { permission: { name: 'MATRICES_DELETE' } },
            ],
        },
    } as unknown as User;
}

// ─── Mocked service ──────────────────────────────────────────────────────────

const matricesServiceMock = {
    generateUploadUrl: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Matrices endpoints (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [MatricesController],
            providers: [{ provide: MatricesService, useValue: matricesServiceMock }],
        }).compile();

        app = module.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
        );

        // Middleware that injects the fake user so @CurrentUser() works
        app.use((req: any, _res: any, next: () => void) => {
            req.user = buildUser();
            next();
        });

        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    // ─── GET /matrices ───────────────────────────────────────────────────────

    describe('GET /matrices', () => {
        it('returns 200 with an array of matrices', async () => {
            matricesServiceMock.findAll.mockResolvedValue([
                { matrixId: TEST_UUID, name: 'Matrix1', uploadedAt: new Date().toISOString() },
            ]);

            const response = await request(app.getHttpServer()).get('/matrices').expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0].name).toBe('Matrix1');
        });

        it('returns 200 with an empty array when user has no matrices', async () => {
            matricesServiceMock.findAll.mockResolvedValue([]);
            const response = await request(app.getHttpServer()).get('/matrices').expect(200);
            expect(response.body).toEqual([]);
        });
    });

    // ─── GET /matrices/:id ───────────────────────────────────────────────────

    describe('GET /matrices/:id', () => {
        it('returns 200 with matrix detail for a valid UUID', async () => {
            matricesServiceMock.findOne.mockResolvedValue({
                matrixId: TEST_UUID,
                name: 'Matrix1',
                description: 'desc',
                uploadedAt: new Date().toISOString(),
                fileSize: 1024,
            });

            const response = await request(app.getHttpServer())
                .get(`/matrices/${TEST_UUID}`)
                .expect(200);

            expect(response.body.name).toBe('Matrix1');
        });

        it('returns 400 for a non-UUID :id parameter', async () => {
            await request(app.getHttpServer()).get('/matrices/not-a-uuid').expect(400);
        });

        it('returns 404 when service throws NotFoundException', async () => {
            matricesServiceMock.findOne.mockRejectedValue(new NotFoundException('not found'));
            await request(app.getHttpServer()).get(`/matrices/${TEST_UUID}`).expect(404);
        });

        it('returns 403 when service throws ForbiddenException (ownership check)', async () => {
            matricesServiceMock.findOne.mockRejectedValue(new ForbiddenException('access denied'));
            await request(app.getHttpServer()).get(`/matrices/${TEST_UUID}`).expect(403);
        });
    });

    // ─── POST /matrices ──────────────────────────────────────────────────────

    describe('POST /matrices', () => {
        const validBody = {
            matrixId: TEST_UUID,
            name: 'MyMatrix',
            objectKey: TEST_OBJECT_KEY,
            mimeType: 'application/octet-stream',
            fileSize: 1024,
        };

        it('returns 201 when body is valid', async () => {
            matricesServiceMock.create.mockResolvedValue({ message: 'created successfully' });

            const response = await request(app.getHttpServer())
                .post('/matrices')
                .send(validBody)
                .expect(201);

            expect(response.body.message).toContain('created');
        });

        it('returns 400 when matrixId is not a valid UUID v4', async () => {
            await request(app.getHttpServer())
                .post('/matrices')
                .send({ ...validBody, matrixId: 'invalid-id' })
                .expect(400);
        });

        it('returns 400 when name is missing', async () => {
            const { name: _, ...body } = validBody;
            await request(app.getHttpServer()).post('/matrices').send(body).expect(400);
        });

        it('returns 400 when objectKey is shorter than 53 characters', async () => {
            await request(app.getHttpServer())
                .post('/matrices')
                .send({ ...validBody, objectKey: 'short-key' })
                .expect(400);
        });

        it('returns 400 when mimeType is not application/octet-stream', async () => {
            await request(app.getHttpServer())
                .post('/matrices')
                .send({ ...validBody, mimeType: 'text/plain' })
                .expect(400);
        });

        it('returns 400 when unknown fields are included', async () => {
            await request(app.getHttpServer())
                .post('/matrices')
                .send({ ...validBody, unknown: 'field' })
                .expect(400);
        });

        it('returns 422 when service throws BusinessRuleViolationException', async () => {
            matricesServiceMock.create.mockRejectedValue(
                new BusinessRuleViolationException('duplicate name'),
            );
            await request(app.getHttpServer()).post('/matrices').send(validBody).expect(422);
        });
    });

    // ─── PATCH /matrices/:id ─────────────────────────────────────────────────

    describe('PATCH /matrices/:id', () => {
        it('returns 200 on successful update', async () => {
            matricesServiceMock.update.mockResolvedValue({ message: 'updated successfully' });

            const response = await request(app.getHttpServer())
                .patch(`/matrices/${TEST_UUID}`)
                .send({ name: 'Updated' })
                .expect(200);

            expect(response.body.message).toContain('updated');
        });

        it('returns 400 for a non-UUID :id', async () => {
            await request(app.getHttpServer())
                .patch('/matrices/not-a-uuid')
                .send({ name: 'X' })
                .expect(400);
        });
    });

    // ─── DELETE /matrices/:id ─────────────────────────────────────────────────

    describe('DELETE /matrices/:id', () => {
        it('returns 200 on successful removal', async () => {
            matricesServiceMock.remove.mockResolvedValue({ message: 'removed successfully' });

            const response = await request(app.getHttpServer())
                .delete(`/matrices/${TEST_UUID}`)
                .expect(200);

            expect(response.body.message).toContain('removed');
        });

        it('returns 400 for a non-UUID :id', async () => {
            await request(app.getHttpServer()).delete('/matrices/not-a-uuid').expect(400);
        });
    });

    // ─── POST /matrices/get-matrix-upload-url ────────────────────────────────

    describe('POST /matrices/get-matrix-upload-url', () => {
        it('returns 201 with presigned URL for valid payload', async () => {
            matricesServiceMock.generateUploadUrl.mockResolvedValue({
                matrixId: TEST_UUID,
                objectKey: TEST_OBJECT_KEY,
                uploadUrl: 'https://minio/presigned',
            });

            const response = await request(app.getHttpServer())
                .post('/matrices/get-matrix-upload-url')
                .send({ fileName: 'data.nex', fileSize: 1024, fileType: '.nex' })
                .expect(201);

            expect(response.body).toHaveProperty('uploadUrl');
        });

        it('returns 400 when fileName is missing', async () => {
            await request(app.getHttpServer())
                .post('/matrices/get-matrix-upload-url')
                .send({ fileSize: 1024, fileType: '.nex' })
                .expect(400);
        });

        it('returns 400 when fileSize is missing', async () => {
            await request(app.getHttpServer())
                .post('/matrices/get-matrix-upload-url')
                .send({ fileName: 'data.nex', fileType: '.nex' })
                .expect(400);
        });

        it('returns 422 when file type is rejected by service', async () => {
            matricesServiceMock.generateUploadUrl.mockRejectedValue(
                new BusinessRuleViolationException('Only .nex files are allowed.'),
            );
            await request(app.getHttpServer())
                .post('/matrices/get-matrix-upload-url')
                .send({ fileName: 'data.fasta', fileSize: 100, fileType: '.fasta' })
                .expect(422);
        });
    });
});
