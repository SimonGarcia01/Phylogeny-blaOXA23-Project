'use client';

import { CreateUserRequest, UserListItem } from '@/interfaces/users.interfaces';
import { getApiError } from '@/libs/errors';
import usersService from '@/services/users.service';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UsersPage() {
	const user = useAuthStore((s) => s.user);
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
				setUsers(await usersService.getAll());
			} catch (err) {
				setError(getApiError(err));
			} finally {
				setLoading(false);
			}
		}
		loadUsers();
	}, [user?.role, router]);

	async function reloadUsers() {
		try { setUsers(await usersService.getAll()); } catch (err) { setError(getApiError(err)); }
	}

	async function handleDelete(id: number) {
		if (!confirm('Delete this user?')) return;
		setError('');
		try { await usersService.remove(id); await reloadUsers(); } catch (err) { setError(getApiError(err)); }
	}

	async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		try {
			setCreating(true);
			await usersService.create({ firstName, lastName, email, password, role } as CreateUserRequest);
			setShowCreate(false);
			setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setRole('Researcher');
			await reloadUsers();
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setCreating(false);
		}
	}

	if (user?.role !== 'Admin') return null;
	if (loading) return <div className="loading-state">Loading users…</div>;

	return (
		<div>
			<div className="page-header">
				<div>
					<h1 className="page-title">Users</h1>
					<p className="page-subtitle">
						{users.length} account{users.length !== 1 ? 's' : ''} — researchers and admins
					</p>
				</div>
				<button
					className={showCreate ? 'btn btn-secondary' : 'btn btn-primary'}
					onClick={() => { setShowCreate(!showCreate); setError(''); }}
				>
					{showCreate ? 'Cancel' : '+ Create User'}
				</button>
			</div>

			{error && <div className="form-error">{error}</div>}

			{showCreate && (
				<div className="create-panel">
					<p className="create-panel-title">New User</p>
					<form onSubmit={handleCreate}>
						<div className="form-row">
							<div className="form-group">
								<label className="form-label" htmlFor="firstName">First Name</label>
								<input id="firstName" type="text" value={firstName}
									onChange={(e) => setFirstName(e.target.value)} required disabled={creating} />
							</div>
							<div className="form-group">
								<label className="form-label" htmlFor="lastName">Last Name</label>
								<input id="lastName" type="text" value={lastName}
									onChange={(e) => setLastName(e.target.value)} required disabled={creating} />
							</div>
						</div>
						<div className="form-group">
							<label className="form-label" htmlFor="email">Email</label>
							<input id="email" type="email" value={email}
								onChange={(e) => setEmail(e.target.value)} required disabled={creating} />
						</div>
						<div className="form-row">
							<div className="form-group">
								<label className="form-label" htmlFor="password">Password</label>
								<input id="password" type="password" value={password}
									onChange={(e) => setPassword(e.target.value)} required disabled={creating} />
							</div>
							<div className="form-group">
								<label className="form-label" htmlFor="roleSelect">Role</label>
								<select id="roleSelect" value={role}
									onChange={(e) => setRole(e.target.value)} disabled={creating}>
									<option value="Researcher">Researcher</option>
									<option value="Admin">Admin</option>
								</select>
							</div>
						</div>
						<button type="submit" disabled={creating} className="btn btn-primary">
							{creating ? 'Creating…' : 'Create User'}
						</button>
					</form>
				</div>
			)}

			<div className="card">
				<table>
					<thead>
						<tr>
							<th>User</th>
							<th>Email</th>
							<th>Role</th>
							<th style={{ width: '120px' }}>Actions</th>
						</tr>
					</thead>
					<tbody>
						{users.map((u, index) => (
							<tr key={u.id ?? u.email ?? index}>
								<td>
									<div className="user-name-cell">
										<span className="user-avatar">
											{(u.firstName?.[0] ?? '?')}{(u.lastName?.[0] ?? '')}
										</span>
										<span style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</span>
									</div>
								</td>
								<td style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>{u.email}</td>
								<td>
									<span className={u.role === 'Admin' ? 'badge badge-gold' : 'badge badge-blue'}>
										{u.role ?? '—'}
									</span>
								</td>
								<td>
									{u.id != null ? (
										<div style={{ display: 'flex', gap: '0.5rem' }}>
											<Link href={`/users/${u.id}`} className="btn btn-ghost btn-sm">Edit</Link>
											<button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id!)}>
												Delete
											</button>
										</div>
									) : '—'}
								</td>
							</tr>
						))}
						{users.length === 0 && (
							<tr>
								<td colSpan={4}>
									<div className="empty-state"><p>No users found.</p></div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
