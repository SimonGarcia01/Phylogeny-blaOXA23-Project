'use client';

import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';

function Navbar() {
	const token: string | null = useAuthStore((store) => store.token);
	const logout = useAuthStore((store) => store.logout);

	return (
		<header>
			<nav>
				<Link href="/">Home</Link>
				<Link href="/about">About</Link>
				{token ? (
					<>
						<Link href="/dashboard">Dashboard</Link>
						<Link href="/" onClick={logout}>
							Logout
						</Link>
					</>
				) : (
					<>
						<Link href="/auth/login">Login</Link>
						<Link href="/auth/signup">Signup</Link>
					</>
				)}
			</nav>
		</header>
	);
}

export default Navbar;
