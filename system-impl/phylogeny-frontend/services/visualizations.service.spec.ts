jest.mock('./api-client.service', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
	},
}));

jest.mock('@/stores/auth.store', () => ({
	__esModule: true,
	useAuthStore: { getState: jest.fn(() => ({ token: null })) },
}));

import { useAuthStore } from '@/stores/auth.store';
import apiClient from './api-client.service';
import visualizationsService from './visualizations.service';

beforeEach(() => jest.clearAllMocks());

describe('visualizationsService.getAll', () => {
	it('GETs /visualizations', async () => {
		(apiClient.get as jest.Mock).mockResolvedValue([{ visualizationId: 'v1' }]);
		const result = await visualizationsService.getAll();
		expect(apiClient.get).toHaveBeenCalledWith('/visualizations');
		expect(result).toHaveLength(1);
	});
});

describe('visualizationsService.getOne', () => {
	it('GETs /visualizations/:id', async () => {
		const detail = { visualizationId: 'v1', name: 'Viz1' };
		(apiClient.get as jest.Mock).mockResolvedValue(detail);
		const result = await visualizationsService.getOne('v1');
		expect(apiClient.get).toHaveBeenCalledWith('/visualizations/v1');
		expect(result).toEqual(detail);
	});
});

describe('visualizationsService.analyze', () => {
	it('POSTs to /visualizations/analyze', async () => {
		const res = { status: 'PENDING', matrixRequestId: 5 };
		(apiClient.post as jest.Mock).mockResolvedValue(res);
		const result = await visualizationsService.analyze({ matrixId: 'matrix-uuid' });
		expect(apiClient.post).toHaveBeenCalledWith('/visualizations/analyze', { matrixId: 'matrix-uuid' });
		expect(result).toEqual(res);
	});
});

describe('visualizationsService.update', () => {
	it('PATCHes /visualizations/:id', async () => {
		(apiClient.patch as jest.Mock).mockResolvedValue({ message: 'updated successfully' });
		const result = await visualizationsService.update('v1', { name: 'NewName' });
		expect(apiClient.patch).toHaveBeenCalledWith('/visualizations/v1', { name: 'NewName' });
		expect(result.message).toContain('updated');
	});
});

describe('visualizationsService.remove', () => {
	it('DELETEs /visualizations/:id', async () => {
		(apiClient.delete as jest.Mock).mockResolvedValue({ message: 'removed successfully' });
		const result = await visualizationsService.remove('v1');
		expect(apiClient.delete).toHaveBeenCalledWith('/visualizations/v1');
		expect(result.message).toContain('removed');
	});
});

describe('visualizationsService.getTree', () => {
	it('fetches via Next.js API route with Bearer token and returns text', async () => {
		(useAuthStore.getState as jest.Mock).mockReturnValue({ token: 'my-jwt' });
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			text: () => Promise.resolve('(A,B);'),
		});

		const result = await visualizationsService.getTree('v1');

		expect(global.fetch).toHaveBeenCalledWith('/api/visualizations/v1/tree', {
			headers: { Authorization: 'Bearer my-jwt' },
		});
		expect(result).toBe('(A,B);');
	});

	it('uses empty string Bearer when no token', async () => {
		(useAuthStore.getState as jest.Mock).mockReturnValue({ token: null });
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(''),
		});
		await visualizationsService.getTree('v1');
		expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe('Bearer ');
	});

	it('throws with JSON message when response is not ok', async () => {
		(useAuthStore.getState as jest.Mock).mockReturnValue({ token: null });
		global.fetch = jest.fn().mockResolvedValue({
			ok: false,
			status: 404,
			json: () => Promise.resolve({ message: 'not found' }),
		});
		await expect(visualizationsService.getTree('v1')).rejects.toThrow('not found');
	});

	it('joins array message from error response', async () => {
		(useAuthStore.getState as jest.Mock).mockReturnValue({ token: null });
		global.fetch = jest.fn().mockResolvedValue({
			ok: false,
			status: 400,
			json: () => Promise.resolve({ message: ['err1', 'err2'] }),
		});
		await expect(visualizationsService.getTree('v1')).rejects.toThrow('err1, err2');
	});

	it('falls back to status message when JSON parsing fails', async () => {
		(useAuthStore.getState as jest.Mock).mockReturnValue({ token: null });
		global.fetch = jest.fn().mockResolvedValue({
			ok: false,
			status: 500,
			json: () => Promise.reject(new Error('bad json')),
		});
		await expect(visualizationsService.getTree('v1')).rejects.toThrow('Failed to load tree: 500');
	});
});
