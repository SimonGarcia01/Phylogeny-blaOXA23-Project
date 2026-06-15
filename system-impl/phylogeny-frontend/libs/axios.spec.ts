// Mock auth store before importing the module under test
jest.mock('@/stores/auth.store', () => ({
	__esModule: true,
	useAuthStore: { getState: jest.fn(() => ({ token: null })) },
}));

import { useAuthStore } from '@/stores/auth.store';
import axiosInstance from './axios';

// Helper: pull out the first registered request interceptor handler.
// Axios stores handlers in interceptors.request.handlers (internal array).
function getInterceptorFn(): (config: any) => any {
	// @ts-expect-error: accessing internal axios property for testing
	const handler = (axiosInstance.interceptors.request as any).handlers?.[0];
	return handler?.fulfilled ?? handler;
}

describe('axiosInstance', () => {
	it('exports a valid axios instance with HTTP methods', () => {
		expect(typeof axiosInstance.get).toBe('function');
		expect(typeof axiosInstance.post).toBe('function');
		expect(typeof axiosInstance.put).toBe('function');
		expect(typeof axiosInstance.patch).toBe('function');
		expect(typeof axiosInstance.delete).toBe('function');
	});

	it('has a request interceptor registered', () => {
		// @ts-expect-error: accessing internal axios property for testing
		const handlers = (axiosInstance.interceptors.request as any).handlers;
		expect(handlers.length).toBeGreaterThan(0);
	});
});

describe('request interceptor', () => {
	beforeEach(() => {
		(useAuthStore.getState as jest.Mock).mockReturnValue({ token: null });
	});

	it('does not set Authorization header when no token is stored', () => {
		(useAuthStore.getState as jest.Mock).mockReturnValue({ token: null });
		const fn = getInterceptorFn();
		const config = { headers: {} as Record<string, string> };
		const result = fn(config);
		expect(result.headers['Authorization']).toBeUndefined();
	});

	it('sets Bearer Authorization header when a token is stored', () => {
		(useAuthStore.getState as jest.Mock).mockReturnValue({ token: 'my-jwt-token' });
		const fn = getInterceptorFn();
		const config = { headers: {} as Record<string, string> };
		const result = fn(config);
		expect(result.headers['Authorization']).toBe('Bearer my-jwt-token');
	});

	it('returns the config object', () => {
		const fn = getInterceptorFn();
		const config = { headers: {}, url: '/test' };
		const result = fn(config);
		expect(result).toBe(config);
	});
});
