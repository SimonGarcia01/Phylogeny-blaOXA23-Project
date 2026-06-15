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
	const currentUser = useAuthStore((s) => s.user);

	const [user, setUser] = useState<UserListItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [role, setRole] = useState('');
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
				setRole(data.role ?? '');
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
				role: role || undefined,
				...(password ? { password } : {}),
			});
			const updated = await usersService.getOne(id);
			setUser(updated);
			setRole(updated.role ?? '');
			setPassword('');
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (!confirm('Delete this user? This action soft-deletes the account.')) return;
		setError('');
		try {
			await usersService.remove(id);
			router.push('/users');
		} catch (err) {
			setError(getApiError(err));
		}
	}

	if (currentUser?.role !== 'Admin') return null;
	if (loading) return <div className="loading-state">Loading…</div>;
	if (!user) return <div className="loading-state">User not found.</div>;

	return (
		<div>
			<div className="page-header">
				<div>
					<h1 className="page-title">
						{user.firstName} {user.lastName}
					</h1>
					<p className="page-subtitle">User account</p>
				</div>
				<button className="btn btn-secondary" onClick={() => router.push('/users')}>
					← Back
				</button>
			</div>

			{error && <div className="form-error">{error}</div>}

			{/* Info */}
			<div className="card" style={{ marginBottom: '1.25rem' }}>
				<div className="card-header">Account Info</div>
				<div className="card-body">
					<div className="info-grid">
						<div className="info-item">
							<div className="info-key">Email</div>
							<div className="info-val">{user.email}</div>
						</div>
						<div className="info-item">
							<div className="info-key">Role</div>
							<div className="info-val">
								<span className={user.role === 'Admin' ? 'badge badge-gold' : 'badge badge-blue'}>
									{user.role ?? '—'}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Edit */}
			<div className="card" style={{ marginBottom: '1.25rem' }}>
				<div className="card-header">Edit Details</div>
				<div className="card-body">
					<form onSubmit={handleUpdate}>
						<div className="form-row">
							<div className="form-group">
								<label className="form-label" htmlFor="firstName">First Name</label>
								<input
									id="firstName"
									type="text"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
									disabled={saving}
								/>
							</div>
							<div className="form-group">
								<label className="form-label" htmlFor="lastName">Last Name</label>
								<input
									id="lastName"
									type="text"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
									disabled={saving}
								/>
							</div>
						</div>
						<div className="form-group">
							<label className="form-label" htmlFor="email">Email</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={saving}
							/>
						</div>
						<div className="form-group">
							<label className="form-label" htmlFor="role">Role</label>
							<select
								id="role"
								value={role}
								onChange={(e) => setRole(e.target.value)}
								disabled={saving}
							>
								<option value="">— No change —</option>
								<option value="Researcher">Researcher</option>
								<option value="Admin">Admin</option>
							</select>
						</div>
						<div className="form-group">
							<label className="form-label" htmlFor="password">
								New Password{' '}
								<span style={{ fontWeight: 400, color: 'var(--ink-muted)' }}>(leave blank to keep)</span>
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="New password"
								disabled={saving}
							/>
						</div>
						<button type="submit" disabled={saving} className="btn btn-primary">
							{saving ? 'Saving…' : 'Save Changes'}
						</button>
					</form>
				</div>
			</div>

			{/* Danger zone */}
			<div className="danger-zone">
				<div className="danger-zone-title">Danger Zone</div>
				<p>This performs a soft delete. The user&apos;s JWT will become invalid immediately.</p>
				<button className="btn btn-danger" onClick={handleDelete}>
					Delete User
				</button>
			</div>
		</div>
	);
}
