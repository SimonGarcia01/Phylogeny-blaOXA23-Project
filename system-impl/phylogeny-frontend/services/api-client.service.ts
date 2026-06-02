import axiosInstance from '../libs/axios';

const apiClient = {
	async get<TResponse>(url: string): Promise<TResponse> {
		const response = await axiosInstance.get(url);
		return response.data as TResponse;
	},

	async post<TResponse, TBody>(url: string, data: TBody): Promise<TResponse> {
		const response = await axiosInstance.post(url, data);
		return response.data as TResponse;
	},

	async put<TResponse, TBody>(url: string, data: TBody): Promise<TResponse> {
		const response = await axiosInstance.put(url, data);
		return response.data as TResponse;
	},

	async patch<TResponse, TBody>(url: string, data: TBody): Promise<TResponse> {
		const response = await axiosInstance.patch(url, data);
		return response.data as TResponse;
	},

	async delete<TResponse>(url: string): Promise<TResponse> {
		const response = await axiosInstance.delete(url);
		return response.data as TResponse;
	},
};

export default apiClient;
