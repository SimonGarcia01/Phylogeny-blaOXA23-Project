import { useUiStore } from './ui.store';

function resetStore() {
	useUiStore.setState({ sidebarOpen: false });
}

describe('useUiStore', () => {
	beforeEach(resetStore);

	it('starts with sidebarOpen = false', () => {
		expect(useUiStore.getState().sidebarOpen).toBe(false);
	});

	it('toggleSidebar opens the sidebar when it is closed', () => {
		useUiStore.getState().toggleSidebar();
		expect(useUiStore.getState().sidebarOpen).toBe(true);
	});

	it('toggleSidebar closes the sidebar when it is open', () => {
		useUiStore.setState({ sidebarOpen: true });
		useUiStore.getState().toggleSidebar();
		expect(useUiStore.getState().sidebarOpen).toBe(false);
	});

	it('closeSidebar sets sidebarOpen to false', () => {
		useUiStore.setState({ sidebarOpen: true });
		useUiStore.getState().closeSidebar();
		expect(useUiStore.getState().sidebarOpen).toBe(false);
	});

	it('closeSidebar is a no-op when sidebar is already closed', () => {
		useUiStore.getState().closeSidebar();
		expect(useUiStore.getState().sidebarOpen).toBe(false);
	});
});
