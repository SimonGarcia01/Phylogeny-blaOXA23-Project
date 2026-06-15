'use client';

import { CreatePermissionRequest, PermissionListItem } from '@/interfaces/permissions.interfaces';
import { getApiError } from '@/libs/errors';
import permissionsService from '@/services/permissions.service';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PermissionsPage() {
	const user = useAuthStore((s) => s.user);
	const router = useRouter();

	const [permissions, setPermissions] = useState<PermissionListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (user?.role !== 'Admin') { router.replace('/dashboard'); return; }
		async function loadPermissions() {
			try { setPermissions(await permissionsService.getAll()); } catch (err) { setError(getApiError(err)); } finally { setLoading(false); }
		}
		loadPermissions();
	}, [user?.role, router]);

	async function reloadPermissions() {
		try { setPermissions(await permissionsService.getAll()); } catch (err) { setError(getApiError(err)); }
	}

	async function handleDelete(id: number) {
		if (!confirm('Delete this permission?')) return;
		setError('');
		try { await permissionsService.remove(id); await reloadPermissions(); } catch (err) { setError(getApiError(err)); }
	}

	async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		try {
			setCreating(true);
			await permissionsService.create({ name, description: description || undefined } as CreatePermissionRequest);
			setShowCreate(false); setName(''); setDescription('');
			await reloadPermissions();
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setCreating(false);
		}
	}

	if (user?.role !== 'Admin') return null;
	if (loading) return <div className="loading-state">Loading permissions…</div>;

	return (
		<div>
			<div className="page-header">
				<div>
					<h1 className="page-title">Permissions</h1>
					<p className="page-subtitle">Manage available permission keys</p>
				</div>
				<button
					className={showCreate ? 'btn btn-secondary' : 'btn btn-primary'}
					onClick={() => { setShowCreate(!showCreate); setError(''); }}
				>
					{showCreate ? 'Cancel' : 'Create Permission'}
				</button>
			</div>

			{error && <div className="form-error">{error}</div>}

			{showCreate && (
				<div className="create-panel">
					<p className="create-panel-title">New Permission</p>
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
							{creating ? 'Creating…' : 'Create Permission'}
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
						{permissions.map((p, index) => (
							<tr key={p.id ?? p.name ?? index}>
								<td style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
									{p.name}
								</td>
								<td style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>{p.description ?? '—'}</td>
								<td>
									{p.id != null ? (
										<div style={{ display: 'flex', gap: '0.5rem' }}>
											<Link href={`/permissions/${p.id}`} className="btn btn-ghost btn-sm">Edit</Link>
											<button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id!)}>Delete</button>
										</div>
									) : '—'}
								</td>
							</tr>
						))}
						{permissions.length === 0 && (
							<tr><td colSpan={3}><div className="empty-state"><p>No permissions found.</p></div></td></tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
