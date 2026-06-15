jest.mock('./api-client.service', () => ({
	__esModule: true,
	default: { post: jest.fn() },
}));

import apiClient from './api-client.service';
import authService from './auth.service';

beforeEach(() => jest.clearAllMocks());

describe('authService.login', () => {
	it('POSTs to /auth/login and returns the response', async () => {
		const mockResponse = { token: 'jwt', user: { email: 'a@b.com' } };
		(apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

		const result = await authService.login({ email: 'a@b.com', password: 'pass' });

		expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pass' });
		expect(result).toEqual(mockResponse);
	});

	it('propagates errors from the API client', async () => {
		(apiClient.post as jest.Mock).mockRejectedValue(new Error('401'));
		await expect(authService.login({ email: 'x', password: 'y' })).rejects.toThrow('401');
	});
});

describe('authService.signup', () => {
	it('POSTs to /auth/signup and returns the response', async () => {
		const mockResponse = { token: 'jwt', user: { email: 'new@b.com' } };
		(apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

		const dto = { email: 'new@b.com', password: 'pass', firstName: 'A', lastName: 'B' };
		const result = await authService.signup(dto);

		expect(apiClient.post).toHaveBeenCalledWith('/auth/signup', dto);
		expect(result).toEqual(mockResponse);
	});

	it('propagates errors from the API client', async () => {
		(apiClient.post as jest.Mock).mockRejectedValue(new Error('409'));
		await expect(
			authService.signup({ email: 'x', password: 'y', firstName: 'A', lastName: 'B' }),
		).rejects.toThrow('409');
	});
});
