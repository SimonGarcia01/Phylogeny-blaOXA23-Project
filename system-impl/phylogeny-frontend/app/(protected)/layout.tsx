'use client';

import Sidebar from '@/components/Sidebar/Sidebar';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
	const token = useAuthStore((store) => store.token);
	const hasHydrated = useAuthStore((store) => store.hasHydrated);
	const router = useRouter();

	useEffect(() => {
		if (hasHydrated && !token) {
			router.replace('/auth/login');
		}
	}, [hasHydrated, token, router]);

	if (!hasHydrated || !token) {
		return null;
	}

	return (
		<div style={{ display: 'flex' }}>
			<Sidebar />
			<div style={{ flex: 1, padding: '1rem' }}>{children}</div>
		</div>
	);
}
