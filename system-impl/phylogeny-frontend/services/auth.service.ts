import { AuthResponse, LoginRequest } from '@/interfaces/auth.interfaces';
import apiClient from './api-client.service';

const authService = {
	login: async (data: LoginRequest): Promise<AuthResponse> => {
		return apiClient.post<AuthResponse, LoginRequest>('/auth/login', data);
	},
};

export default authService;
