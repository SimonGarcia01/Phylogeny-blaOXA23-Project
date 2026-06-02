import { AuthResponse, LoginRequest, SignupRequest } from '@/interfaces/auth.interfaces';
import apiClient from './api-client.service';

const authService = {
	async login(data: LoginRequest): Promise<AuthResponse> {
		return apiClient.post<AuthResponse, LoginRequest>('/auth/login', data);
	},

	async signup(data: SignupRequest): Promise<AuthResponse> {
		return apiClient.post<AuthResponse, SignupRequest>('/auth/signup', data);
	},
};

export default authService;
