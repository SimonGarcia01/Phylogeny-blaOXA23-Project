'use client';

import { AuthUser } from '@/interfaces/auth.interfaces';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
	const user: AuthUser | null = useAuthStore((store) => store.user);

	const router = useRouter();

	useEffect(() => {
		if (!user) router.replace('/auth/login');
	}, []);

	return (
		<div>
			<h2>Dashboard</h2>
		</div>
	);
}
