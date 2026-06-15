import { ConfigService } from '@nestjs/config';
import { MinioService } from './minio.service';

// Mock the entire minio package
jest.mock('minio', () => {
    const mockClient = {
        bucketExists: jest.fn(),
        makeBucket: jest.fn(),
        presignedPutObject: jest.fn(),
        presignedGetObject: jest.fn(),
        removeObject: jest.fn(),
    };
    return { Client: jest.fn().mockImplementation(() => mockClient) };
});

import * as Minio from 'minio';

function buildConfigService(overrides: Record<string, string> = {}) {
    const defaults: Record<string, string> = {
        MINIO_MATRIX_BUCKET: 'matrices',
        MINIO_VISUALIZATION_BUCKET: 'visualizations',
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: '9000',
        MINIO_USE_SSL: 'false',
        MINIO_ACCESS_KEY: 'minio',
        MINIO_SECRET_KEY: 'minio123',
    };
    const config = { ...defaults, ...overrides };
    return {
        getOrThrow: jest.fn((key: string) => {
            if (config[key] === undefined) throw new Error(`Config key ${key} missing`);
            return config[key];
        }),
        get: jest.fn((key: string) => config[key]),
    } as unknown as ConfigService;
}

function getMockClient() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (Minio.Client as any).mock.results[0]?.value ?? (Minio.Client as jest.Mock).mock.instances[0];
}

describe('MinioService', () => {
    let service: MinioService;
    let mockClient: ReturnType<typeof getMockClient>;

    beforeEach(async () => {
        jest.clearAllMocks();
        const configService = buildConfigService();
        service = new MinioService(configService);

        // Initialize the client by calling onModuleInit
        (Minio.Client as jest.Mock).mockImplementation(() => ({
            bucketExists: jest.fn().mockResolvedValue(true),
            makeBucket: jest.fn(),
            presignedPutObject: jest.fn(),
            presignedGetObject: jest.fn(),
            removeObject: jest.fn(),
        }));

        await service.onModuleInit();
        mockClient = (Minio.Client as jest.Mock).mock.results[0].value;
    });

    describe('bucket name getters', () => {
        it('returns the matrix bucket name from config', () => {
            expect(service.matrixBucketName).toBe('matrices');
        });

        it('returns the visualization bucket name from config', () => {
            expect(service.visualizationBucketName).toBe('visualizations');
        });
    });

    describe('onModuleInit', () => {
        it('creates a Minio.Client with configuration values', () => {
            expect(Minio.Client).toHaveBeenCalledWith(
                expect.objectContaining({
                    endPoint: 'localhost',
                    port: 9000,
                    useSSL: false,
                }),
            );
        });

        it('calls ensureBucket for both buckets on init', () => {
            expect(mockClient.bucketExists).toHaveBeenCalledWith('matrices');
            expect(mockClient.bucketExists).toHaveBeenCalledWith('visualizations');
        });
    });

    describe('ensureBucket', () => {
        it('creates the bucket when it does not exist', async () => {
            mockClient.bucketExists.mockResolvedValue(false);
            mockClient.makeBucket.mockResolvedValue(undefined);
            await service.ensureBucket('new-bucket');
            expect(mockClient.makeBucket).toHaveBeenCalledWith('new-bucket');
        });

        it('does not create the bucket when it already exists', async () => {
            mockClient.bucketExists.mockResolvedValue(true);
            await service.ensureBucket('existing-bucket');
            expect(mockClient.makeBucket).not.toHaveBeenCalled();
        });
    });

    describe('generatePresignedPutUrl', () => {
        it('returns the presigned URL from the minio client', async () => {
            mockClient.presignedPutObject.mockResolvedValue('https://minio/put-url');
            const url = await service.generatePresignedPutUrl('matrices', 'users/1/matrices/uuid');
            expect(mockClient.presignedPutObject).toHaveBeenCalledWith('matrices', 'users/1/matrices/uuid', 3600);
            expect(url).toBe('https://minio/put-url');
        });
    });

    describe('generatePresignedGetUrl', () => {
        it('returns the presigned GET URL from the minio client', async () => {
            mockClient.presignedGetObject.mockResolvedValue('https://minio/get-url');
            const url = await service.generatePresignedGetUrl('visualizations', 'users/1/visualizations/uuid');
            expect(url).toBe('https://minio/get-url');
        });
    });

    describe('deleteFile', () => {
        it('deletes the object when bucket exists', async () => {
            mockClient.bucketExists.mockResolvedValue(true);
            mockClient.removeObject.mockResolvedValue(undefined);
            await service.deleteFile('matrices', 'users/1/matrices/uuid');
            expect(mockClient.removeObject).toHaveBeenCalledWith('matrices', 'users/1/matrices/uuid');
        });

        it('throws when the bucket does not exist', async () => {
            mockClient.bucketExists.mockResolvedValue(false);
            await expect(service.deleteFile('non-existent', 'some/key')).rejects.toThrow(
                'Bucket "non-existent" does not exist.',
            );
        });
    });
});
