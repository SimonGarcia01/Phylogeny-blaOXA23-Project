import { AuthStore } from '@/types/auth-store.type';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			user: null,
			token: null,

			setUser: (user) => set({ user }),
			setToken: (token) => set({ token }),
			logout: () => set({ user: null, token: null }),
		}),
		{
			name: 'auth-storage',
			storage: createJSONStorage(() => localStorage),
		}
	)
);
