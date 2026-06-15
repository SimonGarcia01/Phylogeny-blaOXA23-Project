import {
	CreatePermissionRequest,
	PermissionListItem,
	UpdatePermissionRequest,
} from '@/interfaces/permissions.interfaces';
import apiClient from './api-client.service';

const permissionsService = {
	async getAll(): Promise<PermissionListItem[]> {
		return apiClient.get<PermissionListItem[]>('/permissions');
	},

	async getOne(id: number): Promise<PermissionListItem> {
		return apiClient.get<PermissionListItem>(`/permissions/${id}`);
	},

	async create(dto: CreatePermissionRequest): Promise<{ message: string }> {
		return apiClient.post<{ message: string }, CreatePermissionRequest>('/permissions', dto);
	},

	async update(id: number, dto: UpdatePermissionRequest): Promise<{ message: string }> {
		return apiClient.patch<{ message: string }, UpdatePermissionRequest>(
			`/permissions/${id}`,
			dto,
		);
	},

	async remove(id: number): Promise<{ message: string }> {
		return apiClient.delete<{ message: string }>(`/permissions/${id}`);
	},
};

export default permissionsService;
