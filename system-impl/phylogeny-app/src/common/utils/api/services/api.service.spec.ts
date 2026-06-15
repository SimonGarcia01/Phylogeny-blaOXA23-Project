import { of } from 'rxjs';
import { ApiService } from './api.service';
import { HttpService } from '@nestjs/axios';

function buildHttpService() {
    return {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    };
}

function fakeAxiosResponse(data: unknown, status = 200) {
    return of({ data, status, headers: {} });
}

describe('ApiService', () => {
    let service: ApiService;
    let httpService: ReturnType<typeof buildHttpService>;

    beforeEach(() => {
        httpService = buildHttpService();
        service = new ApiService(httpService as unknown as HttpService);
    });

    describe('get', () => {
        it('calls HttpService.get and returns the data', async () => {
            httpService.get.mockReturnValue(fakeAxiosResponse({ key: 'value' }));
            const result = await service.get<{ key: string }>('http://example.com/resource');
            expect(httpService.get).toHaveBeenCalledWith('http://example.com/resource', undefined);
            expect(result.data).toEqual({ key: 'value' });
            expect(result.status).toBe(200);
        });

        it('forwards options to HttpService.get', async () => {
            httpService.get.mockReturnValue(fakeAxiosResponse({}));
            await service.get('http://x.com', { headers: { Authorization: 'Bearer token' } });
            expect(httpService.get).toHaveBeenCalledWith(
                'http://x.com',
                { headers: { Authorization: 'Bearer token' } },
            );
        });
    });

    describe('post', () => {
        it('calls HttpService.post and returns the data', async () => {
            httpService.post.mockReturnValue(fakeAxiosResponse({ id: 1 }, 201));
            const result = await service.post<{ name: string }, { id: number }>(
                'http://example.com/items',
                { name: 'thing' },
            );
            expect(httpService.post).toHaveBeenCalledWith('http://example.com/items', { name: 'thing' }, undefined);
            expect(result.data).toEqual({ id: 1 });
        });

        it('forwards options including internal-secret header', async () => {
            httpService.post.mockReturnValue(fakeAxiosResponse({}));
            await service.post('http://x.com', {}, { headers: { 'x-internal-secret': 'secret' } });
            expect(httpService.post).toHaveBeenCalledWith(
                'http://x.com',
                {},
                { headers: { 'x-internal-secret': 'secret' } },
            );
        });
    });

    describe('put', () => {
        it('calls HttpService.put and returns the data', async () => {
            httpService.put.mockReturnValue(fakeAxiosResponse({ updated: true }));
            const result = await service.put('http://example.com/items/1', { name: 'new' });
            expect(result.data).toEqual({ updated: true });
        });
    });

    describe('delete', () => {
        it('calls HttpService.delete and returns the data', async () => {
            httpService.delete.mockReturnValue(fakeAxiosResponse({ deleted: true }));
            const result = await service.delete('http://example.com/items/1');
            expect(result.data).toEqual({ deleted: true });
        });
    });
});
