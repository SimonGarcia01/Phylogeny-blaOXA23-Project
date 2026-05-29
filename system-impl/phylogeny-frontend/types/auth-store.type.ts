import { AuthUser } from '@/interfaces/auth.interfaces';

export type AuthStore = {
	user: AuthUser | null;
	token: string | null;

	setUser: (_user: AuthUser | null) => void;
	setToken: (_token: string | null) => void;

	logout: () => void;
};
