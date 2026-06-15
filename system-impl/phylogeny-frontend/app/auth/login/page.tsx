'use client';

import BioBackground from '@/components/BioBackground/BioBackground';
import { AuthResponse } from '@/interfaces/auth.interfaces';
import { getApiError } from '@/libs/errors';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Page() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const router = useRouter();
	const setUser = useAuthStore((s) => s.setUser);
	const setToken = useAuthStore((s) => s.setToken);

	async function handleLogin(event: React.SubmitEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError('');
		try {
			setLoading(true);
			const response: AuthResponse = await authService.login({ email, password });
			setUser(response.user);
			setToken(response.token);
			router.push('/dashboard');
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="bio-page auth-wrapper">
			<BioBackground />

			<div className="bio-page-content auth-card">
				<div className="auth-logo">PhyloGen</div>
				<h2 className="auth-title">Welcome back</h2>
				<p className="auth-subtitle">Sign in to continue to your workspace</p>

				{error && <div className="form-error">{error}</div>}

				<form onSubmit={handleLogin}>
					<div className="form-group">
						<label className="form-label" htmlFor="email">Email</label>
						<input
							type="email"
							id="email"
							name="email"
							placeholder="you@institution.edu"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoComplete="email"
							disabled={loading}
							required
						/>
					</div>
					<div className="form-group">
						<label className="form-label" htmlFor="password">Password</label>
						<input
							type="password"
							id="password"
							name="password"
							placeholder="Your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
							disabled={loading}
							required
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="btn btn-primary"
						style={{ width: '100%', marginTop: '0.5rem' }}
					>
						{loading ? 'Signing in…' : 'Sign In'}
					</button>
				</form>

				<p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
					Don&apos;t have an account?{' '}
					<Link href="/auth/signup" style={{ color: 'var(--accent)', fontWeight: 500 }}>
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
