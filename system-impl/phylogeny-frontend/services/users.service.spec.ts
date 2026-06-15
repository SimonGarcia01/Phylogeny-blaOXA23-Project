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
import usersService from './users.service';

beforeEach(() => jest.clearAllMocks());

describe('usersService.getAll', () => {
	it('GETs /users', async () => {
		(apiClient.get as jest.Mock).mockResolvedValue([{ id: 1, email: 'a@b.com' }]);
		const result = await usersService.getAll();
		expect(apiClient.get).toHaveBeenCalledWith('/users');
		expect(result).toHaveLength(1);
	});
});

describe('usersService.getOne', () => {
	it('GETs /users/:id', async () => {
		(apiClient.get as jest.Mock).mockResolvedValue({ id: 1, email: 'a@b.com' });
		const result = await usersService.getOne(1);
		expect(apiClient.get).toHaveBeenCalledWith('/users/1');
		expect(result).toMatchObject({ id: 1 });
	});
});

describe('usersService.create', () => {
	it('POSTs to /users', async () => {
		(apiClient.post as jest.Mock).mockResolvedValue({ message: 'created' });
		const dto = { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', roleId: 2 };
		const result = await usersService.create(dto);
		expect(apiClient.post).toHaveBeenCalledWith('/users', dto);
		expect(result.message).toBe('created');
	});
});

describe('usersService.update', () => {
	it('PATCHes /users/:id', async () => {
		(apiClient.patch as jest.Mock).mockResolvedValue({ message: 'updated' });
		const result = await usersService.update(1, { firstName: 'Bob' });
		expect(apiClient.patch).toHaveBeenCalledWith('/users/1', { firstName: 'Bob' });
		expect(result.message).toBe('updated');
	});
});

describe('usersService.remove', () => {
	it('DELETEs /users/:id', async () => {
		(apiClient.delete as jest.Mock).mockResolvedValue({ message: 'removed' });
		const result = await usersService.remove(1);
		expect(apiClient.delete).toHaveBeenCalledWith('/users/1');
		expect(result.message).toBe('removed');
	});
});
