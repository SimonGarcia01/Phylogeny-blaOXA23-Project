import { useAuthStore } from './auth.store';

// Reset store state between tests
function resetStore() {
	useAuthStore.setState({ user: null, token: null, hasHydrated: false });
}

describe('useAuthStore', () => {
	beforeEach(resetStore);

	it('starts with null user and token', () => {
		const { user, token } = useAuthStore.getState();
		expect(user).toBeNull();
		expect(token).toBeNull();
	});

	it('starts with hasHydrated = false', () => {
		expect(useAuthStore.getState().hasHydrated).toBe(false);
	});

	it('setUser updates the user', () => {
		const fakeUser = { id: 1, email: 'a@b.com' } as any;
		useAuthStore.getState().setUser(fakeUser);
		expect(useAuthStore.getState().user).toEqual(fakeUser);
	});

	it('setToken updates the token', () => {
		useAuthStore.getState().setToken('jwt-abc');
		expect(useAuthStore.getState().token).toBe('jwt-abc');
	});

	it('setHasHydrated sets the flag to true', () => {
		useAuthStore.getState().setHasHydrated(true);
		expect(useAuthStore.getState().hasHydrated).toBe(true);
	});

	it('logout clears user and token', () => {
		useAuthStore.setState({ user: { id: 1 } as any, token: 'some-token' });
		useAuthStore.getState().logout();
		const { user, token } = useAuthStore.getState();
		expect(user).toBeNull();
		expect(token).toBeNull();
	});

	it('logout does not affect hasHydrated', () => {
		useAuthStore.setState({ hasHydrated: true });
		useAuthStore.getState().logout();
		expect(useAuthStore.getState().hasHydrated).toBe(true);
	});
});
