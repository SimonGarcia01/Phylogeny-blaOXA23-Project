jest.mock('./api-client.service', () => ({
	__esModule: true,
	default: { get: jest.fn() },
}));

import apiClient from './api-client.service';
import matrixRequestsService from './matrices-request.service';

beforeEach(() => jest.clearAllMocks());

describe('matrixRequestsService.getAll', () => {
	it('GETs /matrix-requests and returns the list', async () => {
		const list = [{ id: 1, status: 'PENDING', createdAt: new Date().toISOString() }];
		(apiClient.get as jest.Mock).mockResolvedValue(list);
		const result = await matrixRequestsService.getAll();
		expect(apiClient.get).toHaveBeenCalledWith('/matrix-requests');
		expect(result).toEqual(list);
	});

	it('returns an empty array when there are no requests', async () => {
		(apiClient.get as jest.Mock).mockResolvedValue([]);
		const result = await matrixRequestsService.getAll();
		expect(result).toEqual([]);
	});
});
