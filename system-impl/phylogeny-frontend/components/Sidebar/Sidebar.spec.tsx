import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Next.js mocks ─────────────────────────────────────────────────────────────

let mockPathname = '/dashboard';

jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
}));

jest.mock('next/link', () => {
	const Link = ({ href, children, className }: any) => (
		<a href={href} className={className}>
			{children}
		</a>
	);
	Link.displayName = 'Link';
	return Link;
});

// ── Store mocks ───────────────────────────────────────────────────────────────

let mockUser: { role: string } | null = null;
let mockSidebarOpen = true;
const mockCloseSidebar = jest.fn();

jest.mock('@/stores/auth.store', () => ({
	useAuthStore: (selector: any) =>
		selector({ user: mockUser }),
}));

jest.mock('@/stores/ui.store', () => ({
	useUiStore: (selector: any) =>
		selector({
			sidebarOpen: mockSidebarOpen,
			closeSidebar: mockCloseSidebar,
		}),
}));

import Sidebar from './Sidebar';

function renderSidebar() {
	return render(<Sidebar />);
}

beforeEach(() => {
	mockUser = { role: 'Researcher' };
	mockSidebarOpen = true;
	mockPathname = '/dashboard';
	jest.clearAllMocks();
});

describe('Sidebar — closed state', () => {
	it('renders nothing when sidebarOpen is false', () => {
		mockSidebarOpen = false;
		const { container } = renderSidebar();
		expect(container.firstChild).toBeNull();
	});
});

describe('Sidebar — open state', () => {
	it('renders main navigation links', () => {
		renderSidebar();
		expect(screen.getByText('Dashboard')).toBeInTheDocument();
		expect(screen.getByText('Matrices')).toBeInTheDocument();
		expect(screen.getByText('Visualizations')).toBeInTheDocument();
		expect(screen.getByText('Matrix Requests')).toBeInTheDocument();
	});

	it('does not render admin links for a non-admin user', () => {
		renderSidebar();
		expect(screen.queryByText('Users')).not.toBeInTheDocument();
		expect(screen.queryByText('Roles')).not.toBeInTheDocument();
		expect(screen.queryByText('Permissions')).not.toBeInTheDocument();
	});

	it('renders admin links for an Admin user', () => {
		mockUser = { role: 'Admin' };
		renderSidebar();
		expect(screen.getByText('Users')).toBeInTheDocument();
		expect(screen.getByText('Roles')).toBeInTheDocument();
		expect(screen.getByText('Permissions')).toBeInTheDocument();
	});

	it('renders the sidebar overlay', () => {
		renderSidebar();
		expect(document.querySelector('.sidebar-overlay')).toBeInTheDocument();
	});

	it('calls closeSidebar when the overlay is clicked', () => {
		renderSidebar();
		// closeSidebar is also called once on mount (useEffect with pathname dep)
		const callsBefore = mockCloseSidebar.mock.calls.length;
		fireEvent.click(document.querySelector('.sidebar-overlay')!);
		expect(mockCloseSidebar.mock.calls.length).toBe(callsBefore + 1);
	});
});

describe('Sidebar — active link highlighting', () => {
	it('marks Dashboard as active when on /dashboard', () => {
		mockPathname = '/dashboard';
		renderSidebar();
		const dashLink = screen.getByText('Dashboard').closest('a');
		expect(dashLink).toHaveClass('sidebar-link-active');
	});

	it('marks Matrices as active when on /matrices/some-id', () => {
		mockPathname = '/matrices/some-id';
		renderSidebar();
		const matricesLink = screen.getByText('Matrices').closest('a');
		expect(matricesLink).toHaveClass('sidebar-link-active');
	});

	it('does not mark Dashboard as active when on /matrices', () => {
		mockPathname = '/matrices';
		renderSidebar();
		const dashLink = screen.getByText('Dashboard').closest('a');
		expect(dashLink).not.toHaveClass('sidebar-link-active');
	});
});

describe('Sidebar — null user', () => {
	it('does not render admin section when user is null', () => {
		mockUser = null;
		renderSidebar();
		expect(screen.queryByText('Users')).not.toBeInTheDocument();
	});
});
