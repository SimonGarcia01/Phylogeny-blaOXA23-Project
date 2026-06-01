import { AuthStore } from '@/types/auth-store.type';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			user: null,
			token: null,
			hasHydrated: false,

			setUser: (user) => set({ user }),
			setToken: (token) => set({ token }),
			setHasHydrated: (hasHydrated) => set({ hasHydrated }),
			logout: () => set({ user: null, token: null }),
		}),
		{
			name: 'auth-storage',
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		}
	)
);
