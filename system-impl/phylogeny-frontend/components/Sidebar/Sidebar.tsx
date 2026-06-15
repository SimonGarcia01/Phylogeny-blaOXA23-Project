'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

function Sidebar() {
	const user = useAuthStore((s) => s.user);
	const pathname = usePathname();
	const sidebarOpen = useUiStore((s) => s.sidebarOpen);
	const closeSidebar = useUiStore((s) => s.closeSidebar);

	const isAdmin = user?.role === 'Admin';

	// Close sidebar on route change
	useEffect(() => {
		closeSidebar();
	}, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

	const isActive = (href: string) =>
		href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

	const mainLinks = [
		{ href: '/dashboard', label: 'Dashboard', icon: '⊞' },
		{ href: '/matrices', label: 'Matrices', icon: '⊞' },
		{ href: '/visualizations', label: 'Visualizations', icon: '⊞' },
		{ href: '/matrix-requests', label: 'Matrix Requests', icon: '⊞' },
	];

	const adminLinks = [
		{ href: '/users', label: 'Users', icon: '⊞' },
		{ href: '/roles', label: 'Roles', icon: '⊞' },
		{ href: '/permissions', label: 'Permissions', icon: '⊞' },
	];

	if (!sidebarOpen) return null;

	return (
		<>
			<div className="sidebar-overlay" onClick={closeSidebar} />
			<aside className="sidebar">
				<p className="sidebar-section-label">Main</p>
				<nav>
					{mainLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className={`sidebar-link${isActive(link.href) ? ' sidebar-link-active' : ''}`}
						>
							{link.label}
						</Link>
					))}
				</nav>

				{isAdmin && (
					<>
						<p className="sidebar-section-label">Admin</p>
						<nav>
							{adminLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className={`sidebar-link${isActive(link.href) ? ' sidebar-link-active' : ''}`}
								>
									{link.label}
								</Link>
							))}
						</nav>
					</>
				)}
			</aside>
		</>
	);
}

export default Sidebar;
