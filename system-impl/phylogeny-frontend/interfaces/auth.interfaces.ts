export interface LoginRequest {
	email: string;
	password: string;
}

export interface SignupRequest {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}

export interface AuthResponse {
	token: string;
	user: AuthUser;
}

export interface AuthUser {
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	permissions: string[];
}
