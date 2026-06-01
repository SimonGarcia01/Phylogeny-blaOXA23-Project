import { AuthUser } from '@/interfaces/auth.interfaces';

export type AuthStore = {
	user: AuthUser | null;
	token: string | null;
	hasHydrated: boolean;

	setUser: (_user: AuthUser | null) => void;
	setToken: (_token: string | null) => void;
	setHasHydrated: (_hasHydrated: boolean) => void;

	logout: () => void;
};
