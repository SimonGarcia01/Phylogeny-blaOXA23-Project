'use client';

import Sidebar from '@/components/Sidebar/Sidebar';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
	const token = useAuthStore((s) => s.token);
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
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
		<>
			<Sidebar />
			<div className="app-body">{children}</div>
		</>
	);
}
