'use client';

import { AuthResponse } from '@/interfaces/auth.interfaces';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Page() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const router = useRouter();

	const setUser = useAuthStore((s) => s.setUser);
	const setToken = useAuthStore((s) => s.setToken);

	async function handleLogin(event: React.SubmitEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();

		try {
			setLoading(true);

			const response: AuthResponse = await authService.login({ email, password });

			setUser(response.user);
			setToken(response.token);

			// Redirect to personal dashboard
			router.push('/dashboard');
		} catch (error) {
			console.error('Login failed:', error);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<h2>Login</h2>
			<form onSubmit={handleLogin}>
				<label htmlFor="email">Email:</label>
				<input
					type="email"
					id="email"
					name="email"
					placeholder="Enter your email"
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
					placeholder="Enter your password"
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
		</div>
	);
}
