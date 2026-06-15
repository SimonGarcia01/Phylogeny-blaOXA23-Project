'use client';

import { AuthResponse } from '@/interfaces/auth.interfaces';
import { getApiError } from '@/libs/errors';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
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
	const setToken = useAuthStore((s) => s.setToken);
	const setUser = useAuthStore((s) => s.setUser);

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
			router.push('/dashboard');
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="auth-wrapper">
			<div className="auth-card">
				<div className="auth-logo">PhyloGen</div>
				<h2 className="auth-title">Create your account</h2>
				<p className="auth-subtitle">Join PhyloGen to start analyzing sequences</p>

				{error && <div className="form-error">{error}</div>}

				<form onSubmit={handleSignup}>
					<div className="form-row">
						<div className="form-group">
							<label className="form-label" htmlFor="firstName">First Name</label>
							<input
								type="text"
								id="firstName"
								name="firstName"
								placeholder="First name"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								disabled={loading}
								required
							/>
						</div>
						<div className="form-group">
							<label className="form-label" htmlFor="lastName">Last Name</label>
							<input
								type="text"
								id="lastName"
								name="lastName"
								placeholder="Last name"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								disabled={loading}
								required
							/>
						</div>
					</div>
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
							placeholder="Choose a password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="new-password"
							disabled={loading}
							required
						/>
					</div>
					<div className="form-group">
						<label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							placeholder="Repeat your password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							autoComplete="new-password"
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
						{loading ? 'Creating account…' : 'Create Account'}
					</button>
				</form>

				<p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
					Already have an account?{' '}
					<Link href="/auth/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
