import { ConfigService } from '@nestjs/config';
import { MicroserviceService } from './microservice.service';
import { ApiService } from './api.service';

const mockApiService = () => ({
    post: jest.fn(),
});

const mockConfigService = () => ({
    getOrThrow: jest.fn((key: string) => {
        if (key === 'MICROSERVICE_URL') return 'http://microservice:8000';
        if (key === 'INTERNAL_SECRET') return 'supersecret';
        throw new Error(`Config key not found: ${key}`);
    }),
});

describe('MicroserviceService', () => {
    let service: MicroserviceService;
    let apiService: ReturnType<typeof mockApiService>;

    beforeEach(() => {
        apiService = mockApiService();
        service = new MicroserviceService(
            apiService as unknown as ApiService,
            mockConfigService() as unknown as ConfigService,
        );
    });

    describe('triggerAnalysis', () => {
        it('posts to the correct microservice URL', async () => {
            apiService.post.mockResolvedValue({ data: { taskId: 'queued:viz-abc' } });

            const payload = {
                matrixObjectKey: 'users/1/matrices/uuid',
                visualizationObjectKey: 'users/1/visualizations/uuid',
                visualizationId: 'viz-uuid',
                matrixRequestId: 5,
            };

            const result = await service.triggerAnalysis(payload);

            expect(apiService.post).toHaveBeenCalledWith(
                'http://microservice:8000/analysis/analyze_matrix',
                payload,
                expect.objectContaining({ headers: { 'x-internal-secret': 'supersecret' } }),
            );
            expect(result.taskId).toBe('queued:viz-abc');
        });

        it('propagates errors thrown by ApiService', async () => {
            apiService.post.mockRejectedValue(new Error('network failure'));
            await expect(
                service.triggerAnalysis({ matrixObjectKey: '', visualizationObjectKey: '', visualizationId: '', matrixRequestId: 1 }),
            ).rejects.toThrow('network failure');
        });
    });
});
