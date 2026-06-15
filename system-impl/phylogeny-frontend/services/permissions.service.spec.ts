jest.mock('./api-client.service', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
	},
}));

import apiClient from './api-client.service';
import permissionsService from './permissions.service';

beforeEach(() => jest.clearAllMocks());

describe('permissionsService.getAll', () => {
	it('GETs /permissions', async () => {
		(apiClient.get as jest.Mock).mockResolvedValue([{ id: 1, name: 'MATRICES_READ' }]);
		const result = await permissionsService.getAll();
		expect(apiClient.get).toHaveBeenCalledWith('/permissions');
		expect(result).toHaveLength(1);
	});
});

describe('permissionsService.getOne', () => {
	it('GETs /permissions/:id', async () => {
		(apiClient.get as jest.Mock).mockResolvedValue({ id: 5, name: 'MATRICES_CREATE' });
		const result = await permissionsService.getOne(5);
		expect(apiClient.get).toHaveBeenCalledWith('/permissions/5');
		expect(result).toMatchObject({ id: 5 });
	});
});

describe('permissionsService.create', () => {
	it('POSTs to /permissions', async () => {
		(apiClient.post as jest.Mock).mockResolvedValue({ message: 'created' });
		const result = await permissionsService.create({ name: 'NEW_PERM' });
		expect(apiClient.post).toHaveBeenCalledWith('/permissions', { name: 'NEW_PERM' });
		expect(result.message).toBe('created');
	});
});

describe('permissionsService.update', () => {
	it('PATCHes /permissions/:id', async () => {
		(apiClient.patch as jest.Mock).mockResolvedValue({ message: 'updated' });
		const result = await permissionsService.update(1, { name: 'UPDATED_PERM' });
		expect(apiClient.patch).toHaveBeenCalledWith('/permissions/1', { name: 'UPDATED_PERM' });
		expect(result.message).toBe('updated');
	});
});

describe('permissionsService.remove', () => {
	it('DELETEs /permissions/:id', async () => {
		(apiClient.delete as jest.Mock).mockResolvedValue({ message: 'removed' });
		const result = await permissionsService.remove(3);
		expect(apiClient.delete).toHaveBeenCalledWith('/permissions/3');
		expect(result.message).toBe('removed');
	});
});
