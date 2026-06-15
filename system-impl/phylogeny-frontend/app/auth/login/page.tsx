'use client';

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

	const setUser = useAuthStore((store) => store.setUser);
	const setToken = useAuthStore((store) => store.setToken);

	async function handleLogin(event: React.SubmitEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError('');

		try {
			setLoading(true);

			const response: AuthResponse = await authService.login({ email, password });

			setUser(response.user);
			setToken(response.token);

			// Redirect to personal dashboard
			router.push('/dashboard');
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<h2>Login</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<form onSubmit={handleLogin}>
				<label htmlFor="email">Email:</label>
				<input
					type="email"
					id="email"
					name="email"
					placeholder="user@email.com"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					autoComplete="email"
					disabled={loading}
					required
				/>
				<br />
				<label htmlFor="password">Password:</label>
				<input
					type="password"
					id="password"
					name="password"
					placeholder="Password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					autoComplete="current-password"
					disabled={loading}
					required
				/>
				<br />
				<button type="submit" disabled={loading}>
					{loading ? 'Logging in...' : 'Login'}
				</button>
			</form>
			<p>
				Don&apost have an account yet?, Sign up <Link href="/auth/signup">Here</Link>!
			</p>
		</div>
	);
}
