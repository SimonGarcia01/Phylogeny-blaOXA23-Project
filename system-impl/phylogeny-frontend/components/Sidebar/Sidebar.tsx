'use client';

import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Sidebar() {
	const user = useAuthStore((store) => store.user);
	const pathname = usePathname();

	const isAdmin = user?.role === 'Admin';

	const links = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/matrices', label: 'Matrices' },
		{ href: '/visualizations', label: 'Visualizations' },
		{ href: '/matrix-requests', label: 'Matrix Requests' },
		...(isAdmin
			? [
					{ href: '/users', label: 'Users' },
					{ href: '/roles', label: 'Roles' },
					{ href: '/permissions', label: 'Permissions' },
				]
			: []),
	];

	return (
		<aside style={{ width: '200px', borderRight: '1px solid #ccc', padding: '1rem', minHeight: '100vh' }}>
			<nav>
				<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
					{links.map((link) => (
						<li key={link.href} style={{ marginBottom: '0.5rem' }}>
							<Link
								href={link.href}
								style={{
								fontWeight:
									link.href === '/dashboard'
										? pathname === '/dashboard'
											? 'bold'
											: 'normal'
										: pathname.startsWith(link.href)
											? 'bold'
											: 'normal',
							}}
							>
								{link.label}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</aside>
	);
}

export default Sidebar;
