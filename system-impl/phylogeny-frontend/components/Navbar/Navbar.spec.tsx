import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Next.js mocks ─────────────────────────────────────────────────────────────

let mockPathname = '/';

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

let mockToken: string | null = null;
const mockLogout = jest.fn();
const mockToggleSidebar = jest.fn();

jest.mock('@/stores/auth.store', () => ({
	useAuthStore: (selector: any) =>
		selector({
			token: mockToken,
			logout: mockLogout,
		}),
}));

jest.mock('@/stores/ui.store', () => ({
	useUiStore: (selector: any) =>
		selector({
			toggleSidebar: mockToggleSidebar,
		}),
}));

import Navbar from './Navbar';

function renderNavbar() {
	return render(<Navbar />);
}

beforeEach(() => {
	mockToken = null;
	mockPathname = '/';
	jest.clearAllMocks();
});

describe('Navbar — unauthenticated', () => {
	it('renders the PhyloGen brand link', () => {
		renderNavbar();
		expect(screen.getByText('PhyloGen')).toBeInTheDocument();
	});

	it('shows Login and Sign Up links when there is no token', () => {
		renderNavbar();
		expect(screen.getByText('Login')).toBeInTheDocument();
		expect(screen.getByText('Sign Up')).toBeInTheDocument();
	});

	it('does not show Dashboard link when unauthenticated', () => {
		renderNavbar();
		expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
	});

	it('does not show the Logout button when unauthenticated', () => {
		renderNavbar();
		expect(screen.queryByText('Logout')).not.toBeInTheDocument();
	});

	it('does not render the hamburger button on a public page', () => {
		renderNavbar();
		expect(screen.queryByLabelText('Toggle navigation')).not.toBeInTheDocument();
	});

	it('shows Home link with active class on the home page', () => {
		renderNavbar();
		const homeLink = screen.getByText('Home').closest('a');
		expect(homeLink).toHaveClass('nav-link-active');
	});

	it('shows About link without active class when not on /about', () => {
		renderNavbar();
		const aboutLink = screen.getByText('About').closest('a');
		expect(aboutLink).not.toHaveClass('nav-link-active');
	});
});

describe('Navbar — authenticated', () => {
	beforeEach(() => {
		mockToken = 'jwt-token';
	});

	it('shows Dashboard link when authenticated', () => {
		renderNavbar();
		expect(screen.getByText('Dashboard')).toBeInTheDocument();
	});

	it('shows Logout button when authenticated', () => {
		renderNavbar();
		expect(screen.getByText('Logout')).toBeInTheDocument();
	});

	it('does not show Login when authenticated', () => {
		renderNavbar();
		expect(screen.queryByText('Login')).not.toBeInTheDocument();
	});

	it('calls logout when Logout button is clicked', () => {
		renderNavbar();
		fireEvent.click(screen.getByText('Logout'));
		expect(mockLogout).toHaveBeenCalledTimes(1);
	});
});

describe('Navbar — hamburger button on protected routes', () => {
	beforeEach(() => {
		mockToken = 'jwt-token';
		mockPathname = '/dashboard';
	});

	it('renders the hamburger button on a protected route', () => {
		renderNavbar();
		expect(screen.getByLabelText('Toggle navigation')).toBeInTheDocument();
	});

	it('calls toggleSidebar when hamburger is clicked', () => {
		renderNavbar();
		fireEvent.click(screen.getByLabelText('Toggle navigation'));
		expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
	});

	it('does not show hamburger when unauthenticated even on a protected route', () => {
		mockToken = null;
		renderNavbar();
		expect(screen.queryByLabelText('Toggle navigation')).not.toBeInTheDocument();
	});
});

describe('Navbar — active link detection', () => {
	beforeEach(() => {
		mockToken = 'jwt-token';
		mockPathname = '/dashboard';
	});

	it('marks Dashboard as active when on /dashboard', () => {
		renderNavbar();
		const dashboardLink = screen.getByText('Dashboard').closest('a');
		expect(dashboardLink).toHaveClass('nav-link-active');
	});

	it('does not mark Home as active when on /dashboard', () => {
		renderNavbar();
		const homeLink = screen.getByText('Home').closest('a');
		expect(homeLink).not.toHaveClass('nav-link-active');
	});

	it('marks About as active when on /about', () => {
		mockPathname = '/about';
		renderNavbar();
		const aboutLink = screen.getByText('About').closest('a');
		expect(aboutLink).toHaveClass('nav-link-active');
	});
});

describe('Navbar — unauthenticated active links', () => {
	it('marks Login as active when on /auth/login', () => {
		mockToken = null;
		mockPathname = '/auth/login';
		renderNavbar();
		const loginLink = screen.getByText('Login').closest('a');
		expect(loginLink).toHaveClass('nav-link-active');
	});
});
