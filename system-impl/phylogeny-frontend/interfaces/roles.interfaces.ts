export interface RoleListItem {
	id?: number;
	name?: string;
	description?: string;
	permissions?: string[];
}

export interface CreateRoleRequest {
	name: string;
	description?: string;
}

export interface UpdateRoleRequest {
	name?: string;
	description?: string;
}
