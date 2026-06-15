export interface UserListItem {
	id?: number;
	email?: string;
	firstName?: string;
	lastName?: string;
	role?: string;
}

export interface CreateUserRequest {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	role: string;
}

export interface UpdateUserRequest {
	firstName?: string;
	lastName?: string;
	email?: string;
	password?: string;
	role?: string;
}
