import { CreateRoleRequest, RoleListItem, UpdateRoleRequest } from '@/interfaces/roles.interfaces';
import apiClient from './api-client.service';

const rolesService = {
	async getAll(): Promise<RoleListItem[]> {
		return apiClient.get<RoleListItem[]>('/roles');
	},

	async getOne(id: number): Promise<RoleListItem> {
		return apiClient.get<RoleListItem>(`/roles/${id}`);
	},

	async create(dto: CreateRoleRequest): Promise<{ message: string }> {
		return apiClient.post<{ message: string }, CreateRoleRequest>('/roles', dto);
	},

	async update(id: number, dto: UpdateRoleRequest): Promise<{ message: string }> {
		return apiClient.patch<{ message: string }, UpdateRoleRequest>(`/roles/${id}`, dto);
	},

	async remove(id: number): Promise<{ message: string }> {
		return apiClient.delete<{ message: string }>(`/roles/${id}`);
	},
};

export default rolesService;
