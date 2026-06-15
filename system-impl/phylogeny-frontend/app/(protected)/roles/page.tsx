'use client';

import { CreateRoleRequest, RoleListItem } from '@/interfaces/roles.interfaces';
import { getApiError } from '@/libs/errors';
import rolesService from '@/services/roles.service';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RolesPage() {
	const user = useAuthStore((s) => s.user);
	const router = useRouter();

	const [roles, setRoles] = useState<RoleListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (user?.role !== 'Admin') { router.replace('/dashboard'); return; }
		async function loadRoles() {
			try { setRoles(await rolesService.getAll()); } catch (err) { setError(getApiError(err)); } finally { setLoading(false); }
		}
		loadRoles();
	}, [user?.role, router]);

	async function reloadRoles() {
		try { setRoles(await rolesService.getAll()); } catch (err) { setError(getApiError(err)); }
	}

	async function handleDelete(id: number) {
		if (!confirm('Delete this role?')) return;
		setError('');
		try { await rolesService.remove(id); await reloadRoles(); } catch (err) { setError(getApiError(err)); }
	}

	async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		try {
			setCreating(true);
			await rolesService.create({ name, description: description || undefined } as CreateRoleRequest);
			setShowCreate(false); setName(''); setDescription('');
			await reloadRoles();
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setCreating(false);
		}
	}

	if (user?.role !== 'Admin') return null;
	if (loading) return <div className="loading-state">Loading roles…</div>;

	return (
		<div>
			<div className="page-header">
				<div>
					<h1 className="page-title">Roles</h1>
					<p className="page-subtitle">Manage user roles and permissions</p>
				</div>
				<button
					className={showCreate ? 'btn btn-secondary' : 'btn btn-primary'}
					onClick={() => { setShowCreate(!showCreate); setError(''); }}
				>
					{showCreate ? 'Cancel' : 'Create Role'}
				</button>
			</div>

			{error && <div className="form-error">{error}</div>}

			{showCreate && (
				<div className="create-panel">
					<p className="create-panel-title">New Role</p>
					<form onSubmit={handleCreate}>
						<div className="form-row">
							<div className="form-group">
								<label className="form-label" htmlFor="name">Name</label>
								<input id="name" type="text" value={name}
									onChange={(e) => setName(e.target.value)} required disabled={creating} />
							</div>
							<div className="form-group">
								<label className="form-label" htmlFor="description">Description</label>
								<input id="description" type="text" value={description}
									onChange={(e) => setDescription(e.target.value)} disabled={creating} />
							</div>
						</div>
						<button type="submit" disabled={creating} className="btn btn-primary">
							{creating ? 'Creating…' : 'Create Role'}
						</button>
					</form>
				</div>
			)}

			<div className="card">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Description</th>
							<th style={{ width: '120px' }}>Actions</th>
						</tr>
					</thead>
					<tbody>
						{roles.map((r, index) => (
							<tr key={r.id ?? r.name ?? index}>
								<td style={{ fontWeight: 500 }}>
									<span className="badge badge-blue">{r.name}</span>
								</td>
								<td style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>{r.description ?? '—'}</td>
								<td>
									{r.id != null ? (
										<div style={{ display: 'flex', gap: '0.5rem' }}>
											<Link href={`/roles/${r.id}`} className="btn btn-ghost btn-sm">Edit</Link>
											<button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id!)}>Delete</button>
										</div>
									) : '—'}
								</td>
							</tr>
						))}
						{roles.length === 0 && (
							<tr><td colSpan={3}><div className="empty-state"><p>No roles found.</p></div></td></tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
