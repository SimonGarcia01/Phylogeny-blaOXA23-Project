import { CreateUserRequest, UpdateUserRequest, UserListItem } from '@/interfaces/users.interfaces';
import apiClient from './api-client.service';

const usersService = {
	async getAll(): Promise<UserListItem[]> {
		return apiClient.get<UserListItem[]>('/users');
	},

	async getOne(id: number): Promise<UserListItem> {
		return apiClient.get<UserListItem>(`/users/${id}`);
	},

	async create(dto: CreateUserRequest): Promise<{ message: string }> {
		return apiClient.post<{ message: string }, CreateUserRequest>('/users', dto);
	},

	async update(id: number, dto: UpdateUserRequest): Promise<{ message: string }> {
		return apiClient.patch<{ message: string }, UpdateUserRequest>(`/users/${id}`, dto);
	},

	async remove(id: number): Promise<{ message: string }> {
		return apiClient.delete<{ message: string }>(`/users/${id}`);
	},
};

export default usersService;
