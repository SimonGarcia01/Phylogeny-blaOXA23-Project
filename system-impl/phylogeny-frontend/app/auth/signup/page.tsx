'use client';

import { AuthResponse } from '@/interfaces/auth.interfaces';
import { getApiError } from '@/libs/errors';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Page() {
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const router = useRouter();

	const setToken = useAuthStore((store) => store.setToken);
	const setUser = useAuthStore((store) => store.setUser);

	async function handleSignup(event: React.SubmitEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError('');

		if (password !== confirmPassword) {
			setError('Passwords do not match.');
			return;
		}

		try {
			setLoading(true);

			const response: AuthResponse = await authService.signup({
				firstName,
				lastName,
				email,
				password,
			});

			setToken(response.token);
			setUser(response.user);

			//Push to the personal dashboard
			router.push('/dashboard');
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<h2>Sign Up</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<br />
			<form onSubmit={handleSignup}>
				<label htmlFor="firstName">First Name:</label>
				<input
					type="text"
					id="firstName"
					name="firstName"
					value={firstName}
					onChange={(event) => setFirstName(event.target.value)}
					disabled={loading}
					required
				></input>
				<br />
				<label htmlFor="lastName">Last Name:</label>
				<input
					type="text"
					id="lastName"
					name="lastName"
					value={lastName}
					onChange={(event) => setLastName(event.target.value)}
					disabled={loading}
					required
				></input>
				<br />
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
				<label htmlFor="confirmPassword">Confirm Password:</label>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					placeholder="Confirm Password"
					value={confirmPassword}
					onChange={(event) => setConfirmPassword(event.target.value)}
					autoComplete="new-password"
					disabled={loading}
					required
				/>
				<br />
				<button type="submit">Sign Up</button>
			</form>
		</div>
	);
}
