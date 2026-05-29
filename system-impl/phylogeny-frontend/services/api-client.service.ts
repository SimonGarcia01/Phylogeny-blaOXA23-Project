import axiosInstance from '../libs/axios';

const apiClient = {
	get: async <TResponse>(url: string): Promise<TResponse> => {
		const response = await axiosInstance.get(url);
		return response.data as TResponse;
	},

	post: async <TResponse, TBody>(url: string, data: TBody): Promise<TResponse> => {
		const response = await axiosInstance.post(url, data);
		return response.data as TResponse;
	},

	put: async <TResponse, TBody>(url: string, data: TBody): Promise<TResponse> => {
		const response = await axiosInstance.put(url, data);
		return response.data as TResponse;
	},

	patch: async <TResponse, TBody>(url: string, data: TBody): Promise<TResponse> => {
		const response = await axiosInstance.patch(url, data);
		return response.data as TResponse;
	},

	delete: async <TResponse>(url: string): Promise<TResponse> => {
		const response = await axiosInstance.delete(url);
		return response.data as TResponse;
	},
};

export default apiClient;
