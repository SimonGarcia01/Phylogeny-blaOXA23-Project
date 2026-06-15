'use client';

import { UserListItem } from '@/interfaces/users.interfaces';
import { getApiError } from '@/libs/errors';
import usersService from '@/services/users.service';
import { useAuthStore } from '@/stores/auth.store';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UserDetailPage() {
	const params = useParams();
	const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
	const router = useRouter();
	const currentUser = useAuthStore((store) => store.user);

	const [user, setUser] = useState<UserListItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (currentUser?.role !== 'Admin') {
			router.replace('/dashboard');
			return;
		}

		async function load() {
			try {
				const data = await usersService.getOne(id);
				setUser(data);
				setFirstName(data.firstName ?? '');
				setLastName(data.lastName ?? '');
				setEmail(data.email ?? '');
			} catch (err) {
				setError(getApiError(err));
			} finally {
				setLoading(false);
			}
		}
		load();
	}, [id, currentUser?.role, router]);

	async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		try {
			setSaving(true);
			await usersService.update(id, {
				firstName,
				lastName,
				email,
				...(password ? { password } : {}),
			});
			const updated = await usersService.getOne(id);
			setUser(updated);
			setPassword('');
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (!confirm('Delete this user?')) return;
		setError('');
		try {
			await usersService.remove(id);
			router.push('/users');
		} catch (err) {
			setError(getApiError(err));
		}
	}

	if (currentUser?.role !== 'Admin') return null;
	if (loading) return <p>Loading...</p>;
	if (!user) return <p>User not found.</p>;

	return (
		<div>
			<h2>User Detail</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<p>Email: {user.email}</p>
			<p>Role: {user.role ?? '-'}</p>
			<hr />
			<h3>Edit</h3>
			<form onSubmit={handleUpdate}>
				<div>
					<label htmlFor="firstName">First Name:</label>
					<input
						id="firstName"
						type="text"
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
						disabled={saving}
					/>
				</div>
				<div>
					<label htmlFor="lastName">Last Name:</label>
					<input
						id="lastName"
						type="text"
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
						disabled={saving}
					/>
				</div>
				<div>
					<label htmlFor="email">Email:</label>
					<input
						id="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={saving}
					/>
				</div>
				<div>
					<label htmlFor="password">New Password (leave blank to keep):</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						disabled={saving}
					/>
				</div>
				<button type="submit" disabled={saving}>
					{saving ? 'Saving...' : 'Save'}
				</button>
			</form>
			<hr />
			<button onClick={handleDelete}>Delete User</button>
			<br />
			<br />
			<button onClick={() => router.push('/users')}>Back to Users</button>
		</div>
	);
}
