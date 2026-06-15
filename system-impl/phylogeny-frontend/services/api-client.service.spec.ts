// Mock the axios instance so no real HTTP calls are made
const mockAxiosInstance = {
	get: jest.fn(),
	post: jest.fn(),
	put: jest.fn(),
	patch: jest.fn(),
	delete: jest.fn(),
	interceptors: { request: { use: jest.fn() } },
};

jest.mock('../libs/axios', () => mockAxiosInstance);

import apiClient from './api-client.service';

beforeEach(() => jest.clearAllMocks());

describe('apiClient.get', () => {
	it('calls axiosInstance.get and returns response.data', async () => {
		mockAxiosInstance.get.mockResolvedValue({ data: { id: 1 } });
		const result = await apiClient.get('/test');
		expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test');
		expect(result).toEqual({ id: 1 });
	});
});

describe('apiClient.post', () => {
	it('calls axiosInstance.post with url and body and returns response.data', async () => {
		mockAxiosInstance.post.mockResolvedValue({ data: { message: 'created' } });
		const result = await apiClient.post('/items', { name: 'x' });
		expect(mockAxiosInstance.post).toHaveBeenCalledWith('/items', { name: 'x' });
		expect(result).toEqual({ message: 'created' });
	});
});

describe('apiClient.put', () => {
	it('calls axiosInstance.put with url and body and returns response.data', async () => {
		mockAxiosInstance.put.mockResolvedValue({ data: { message: 'updated' } });
		const result = await apiClient.put('/items/1', { name: 'y' });
		expect(mockAxiosInstance.put).toHaveBeenCalledWith('/items/1', { name: 'y' });
		expect(result).toEqual({ message: 'updated' });
	});
});

describe('apiClient.patch', () => {
	it('calls axiosInstance.patch with url and body and returns response.data', async () => {
		mockAxiosInstance.patch.mockResolvedValue({ data: { message: 'patched' } });
		const result = await apiClient.patch('/items/1', { name: 'z' });
		expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/items/1', { name: 'z' });
		expect(result).toEqual({ message: 'patched' });
	});
});

describe('apiClient.delete', () => {
	it('calls axiosInstance.delete with url and returns response.data', async () => {
		mockAxiosInstance.delete.mockResolvedValue({ data: { message: 'deleted' } });
		const result = await apiClient.delete('/items/1');
		expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/items/1');
		expect(result).toEqual({ message: 'deleted' });
	});
});
