'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Navbar() {
	const token = useAuthStore((s) => s.token);
	const logout = useAuthStore((s) => s.logout);
	const toggleSidebar = useUiStore((s) => s.toggleSidebar);
	const pathname = usePathname();

	const isProtected = pathname.startsWith('/dashboard') ||
		pathname.startsWith('/matrices') ||
		pathname.startsWith('/visualizations') ||
		pathname.startsWith('/matrix-requests') ||
		pathname.startsWith('/users') ||
		pathname.startsWith('/roles') ||
		pathname.startsWith('/permissions');

	return (
		<header className="navbar">
			<div className="navbar-left">
				{token && isProtected && (
					<button
						className="hamburger-btn"
						onClick={toggleSidebar}
						aria-label="Toggle navigation"
					>
						<span />
						<span />
						<span />
					</button>
				)}
				<Link href="/" className="navbar-brand">
					PhyloGen
				</Link>
			</div>

			<nav className="navbar-links">
				<Link
					href="/"
					className={`nav-link${pathname === '/' ? ' nav-link-active' : ''}`}
				>
					Home
				</Link>
				<Link
					href="/about"
					className={`nav-link${pathname.startsWith('/about') ? ' nav-link-active' : ''}`}
				>
					About
				</Link>
				{token ? (
					<>
						<Link
							href="/dashboard"
							className={`nav-link${pathname.startsWith('/dashboard') ? ' nav-link-active' : ''}`}
						>
							Dashboard
						</Link>
						<button
							className="btn btn-secondary btn-sm"
							onClick={logout}
							style={{ marginLeft: '0.25rem' }}
						>
							Logout
						</button>
					</>
				) : (
					<>
						<Link
							href="/auth/login"
							className={`nav-link${pathname.startsWith('/auth/login') ? ' nav-link-active' : ''}`}
						>
							Login
						</Link>
						<Link href="/auth/signup" className="btn btn-primary btn-sm" style={{ marginLeft: '0.25rem' }}>
							Sign Up
						</Link>
					</>
				)}
			</nav>
		</header>
	);
}

export default Navbar;
