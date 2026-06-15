'use client';

import { CreateUserRequest, UserListItem } from '@/interfaces/users.interfaces';
import { getApiError } from '@/libs/errors';
import usersService from '@/services/users.service';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UsersPage() {
	const user = useAuthStore((store) => store.user);
	const router = useRouter();

	const [users, setUsers] = useState<UserListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState('Researcher');
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (user?.role !== 'Admin') {
			router.replace('/dashboard');
			return;
		}

		async function loadUsers() {
			try {
				const data = await usersService.getAll();
				setUsers(data);
			} catch (err) {
				setError(getApiError(err));
			} finally {
				setLoading(false);
			}
		}

		loadUsers();
	}, [user?.role, router]);

	async function reloadUsers() {
		try {
			const data = await usersService.getAll();
			setUsers(data);
		} catch (err) {
			setError(getApiError(err));
		}
	}

	async function handleDelete(id: number) {
		if (!confirm('Delete this user?')) return;
		setError('');
		try {
			await usersService.remove(id);
			await reloadUsers();
		} catch (err) {
			setError(getApiError(err));
		}
	}

	async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		try {
			setCreating(true);
			const dto: CreateUserRequest = { firstName, lastName, email, password, role };
			await usersService.create(dto);
			setShowCreate(false);
			setFirstName('');
			setLastName('');
			setEmail('');
			setPassword('');
			setRole('Researcher');
			await reloadUsers();
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setCreating(false);
		}
	}

	if (user?.role !== 'Admin') return null;
	if (loading) return <p>Loading...</p>;

	return (
		<div>
			<h2>Users</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<button onClick={() => setShowCreate(!showCreate)}>
				{showCreate ? 'Cancel' : 'Create User'}
			</button>

			{showCreate && (
				<form onSubmit={handleCreate}>
					<div>
						<label htmlFor="firstName">First Name:</label>
						<input
							id="firstName"
							type="text"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							required
							disabled={creating}
						/>
					</div>
					<div>
						<label htmlFor="lastName">Last Name:</label>
						<input
							id="lastName"
							type="text"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							required
							disabled={creating}
						/>
					</div>
					<div>
						<label htmlFor="email">Email:</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={creating}
						/>
					</div>
					<div>
						<label htmlFor="password">Password:</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							disabled={creating}
						/>
					</div>
					<div>
						<label htmlFor="role">Role:</label>
						<select
							id="role"
							value={role}
							onChange={(e) => setRole(e.target.value)}
							disabled={creating}
						>
							<option value="Researcher">Researcher</option>
							<option value="Admin">Admin</option>
						</select>
					</div>
					<button type="submit" disabled={creating}>
						{creating ? 'Creating...' : 'Create'}
					</button>
				</form>
			)}

			<br />
			<table>
				<thead>
					<tr>
						<th>Email</th>
						<th>Name</th>
						<th>Role</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{users.map((u, index) => (
						<tr key={u.id ?? u.email ?? index}>
							<td>{u.email}</td>
							<td>
								{u.firstName} {u.lastName}
							</td>
							<td>{u.role ?? '-'}</td>
							<td>
								{u.id != null ? (
									<>
										<Link href={`/users/${u.id}`}>Edit</Link>
										{' | '}
										<button onClick={() => handleDelete(u.id!)}>Delete</button>
									</>
								) : (
									'-'
								)}
							</td>
						</tr>
					))}
					{users.length === 0 && (
						<tr>
							<td colSpan={4}>No users found.</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
