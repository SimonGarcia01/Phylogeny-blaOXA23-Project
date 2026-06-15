jest.mock('./api-client.service', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
	},
}));

import apiClient from './api-client.service';
import rolesService from './roles.service';

beforeEach(() => jest.clearAllMocks());

describe('rolesService.getAll', () => {
	it('GETs /roles', async () => {
		(apiClient.get as jest.Mock).mockResolvedValue([{ id: 1, name: 'Researcher' }]);
		const result = await rolesService.getAll();
		expect(apiClient.get).toHaveBeenCalledWith('/roles');
		expect(result).toHaveLength(1);
	});
});

describe('rolesService.getOne', () => {
	it('GETs /roles/:id', async () => {
		(apiClient.get as jest.Mock).mockResolvedValue({ id: 1, name: 'Researcher' });
		const result = await rolesService.getOne(1);
		expect(apiClient.get).toHaveBeenCalledWith('/roles/1');
		expect(result).toMatchObject({ id: 1 });
	});
});

describe('rolesService.create', () => {
	it('POSTs to /roles', async () => {
		(apiClient.post as jest.Mock).mockResolvedValue({ message: 'created' });
		const result = await rolesService.create({ name: 'Admin' });
		expect(apiClient.post).toHaveBeenCalledWith('/roles', { name: 'Admin' });
		expect(result.message).toBe('created');
	});
});

describe('rolesService.update', () => {
	it('PATCHes /roles/:id', async () => {
		(apiClient.patch as jest.Mock).mockResolvedValue({ message: 'updated' });
		const result = await rolesService.update(1, { name: 'SuperAdmin' });
		expect(apiClient.patch).toHaveBeenCalledWith('/roles/1', { name: 'SuperAdmin' });
		expect(result.message).toBe('updated');
	});
});

describe('rolesService.remove', () => {
	it('DELETEs /roles/:id', async () => {
		(apiClient.delete as jest.Mock).mockResolvedValue({ message: 'removed' });
		const result = await rolesService.remove(1);
		expect(apiClient.delete).toHaveBeenCalledWith('/roles/1');
		expect(result.message).toBe('removed');
	});
});

describe('rolesService.setPermissions', () => {
	it('PUTs to /roles-permissions/role/:roleId with permission IDs', async () => {
		(apiClient.put as jest.Mock).mockResolvedValue({ message: 'permissions updated' });
		const result = await rolesService.setPermissions(2, [10, 11, 12]);
		expect(apiClient.put).toHaveBeenCalledWith('/roles-permissions/role/2', { permissionIds: [10, 11, 12] });
		expect(result.message).toContain('permissions');
	});

	it('PUTs with an empty permission list', async () => {
		(apiClient.put as jest.Mock).mockResolvedValue({ message: 'permissions cleared' });
		await rolesService.setPermissions(1, []);
		expect(apiClient.put).toHaveBeenCalledWith('/roles-permissions/role/1', { permissionIds: [] });
	});
});
