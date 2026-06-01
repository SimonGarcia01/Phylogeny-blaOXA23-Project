'use client';

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

	return <>{children}</>;
}
