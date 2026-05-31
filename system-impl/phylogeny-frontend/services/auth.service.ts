import { AuthResponse, LoginRequest, SignupRequest } from '@/interfaces/auth.interfaces';
import apiClient from './api-client.service';

const authService = {
	login: async (data: LoginRequest): Promise<AuthResponse> => {
		return apiClient.post<AuthResponse, LoginRequest>('/auth/login', data);
	},

	signup: async (data: SignupRequest): Promise<AuthResponse> => {
		return apiClient.post<AuthResponse, SignupRequest>('/auth/signup', data);
	},
};

export default authService;
