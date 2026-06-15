import { AxiosError } from 'axios';

export function getApiError(error: unknown): string {
	if (error instanceof Error) {
		const axiosError = error as AxiosError<{ message: string | string[] }>;
		if (axiosError.response?.data?.message) {
			const msg = axiosError.response.data.message;
			return Array.isArray(msg) ? msg.join(', ') : msg;
		}
		return axiosError.message;
	}
	return 'An unexpected error occurred';
}
