import { AxiosError } from 'axios';
import { getApiError } from './errors';

function makeAxiosError(message: string | string[] | undefined, fallback = 'axios error'): AxiosError {
	const err = new Error(fallback) as AxiosError;
	err.isAxiosError = true;
	// @ts-expect-error building a minimal fake response
	err.response = message !== undefined ? { data: { message } } : undefined;
	return err;
}

describe('getApiError', () => {
	it('returns a string message from an Axios error response', () => {
		const err = makeAxiosError('Invalid credentials');
		expect(getApiError(err)).toBe('Invalid credentials');
	});

	it('joins array messages from an Axios error response', () => {
		const err = makeAxiosError(['email must be valid', 'password is too short']);
		expect(getApiError(err)).toBe('email must be valid, password is too short');
	});

	it('falls back to err.message when no response data', () => {
		const err = makeAxiosError(undefined, 'Network Error');
		expect(getApiError(err)).toBe('Network Error');
	});

	it('returns a fallback string for non-Error unknowns', () => {
		expect(getApiError('some string')).toBe('An unexpected error occurred');
	});

	it('returns a fallback string for null', () => {
		expect(getApiError(null)).toBe('An unexpected error occurred');
	});

	it('returns a fallback string for plain objects', () => {
		expect(getApiError({ code: 500 })).toBe('An unexpected error occurred');
	});

	it('returns the plain Error message when there is no Axios response', () => {
		const err = new Error('plain error');
		expect(getApiError(err)).toBe('plain error');
	});
});
