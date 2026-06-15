'use client';

import { PermissionListItem } from '@/interfaces/permissions.interfaces';
import { RoleListItem } from '@/interfaces/roles.interfaces';
import { getApiError } from '@/libs/errors';
import permissionsService from '@/services/permissions.service';
import rolesService from '@/services/roles.service';
import { useAuthStore } from '@/stores/auth.store';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RoleDetailPage() {
	const params = useParams();
	const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
	const router = useRouter();
	const currentUser = useAuthStore((s) => s.user);

	const [role, setRole] = useState<RoleListItem | null>(null);
	const [allPerms, setAllPerms] = useState<PermissionListItem[]>([]);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [savingPerms, setSavingPerms] = useState(false);
	const [error, setError] = useState('');
	const [permsSaved, setPermsSaved] = useState(false);

	useEffect(() => {
		if (currentUser?.role !== 'Admin') { router.replace('/dashboard'); return; }

		async function load() {
			try {
				const [data, perms] = await Promise.all([
					rolesService.getOne(id),
					permissionsService.getAll(),
				]);
				setRole(data);
				setName(data.name ?? '');
				setDescription(data.description ?? '');
				setAllPerms(perms);

				// Map current permission names → IDs
				const currentNames = new Set(data.permissions ?? []);
				const initIds = new Set(
					perms.filter(p => p.name && currentNames.has(p.name)).map(p => p.id!)
				);
				setSelectedIds(initIds);
			} catch (err) {
				setError(getApiError(err));
			} finally {
				setLoading(false);
			}
		}
		load();
	}, [id, currentUser?.role, router]);

	function togglePerm(pid: number) {
		setSelectedIds(prev => {
			const next = new Set(prev);
			if (next.has(pid)) next.delete(pid); else next.add(pid);
			return next;
		});
		setPermsSaved(false);
	}

	async function handleUpdateRole(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError('');
		try {
			setSaving(true);
			await rolesService.update(id, { name, description: description || undefined });
			const updated = await rolesService.getOne(id);
			setRole(updated);
			setName(updated.name ?? '');
			setDescription(updated.description ?? '');
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setSaving(false);
		}
	}

	async function handleSavePerms() {
		setError('');
		try {
			setSavingPerms(true);
			await rolesService.setPermissions(id, [...selectedIds]);
			setPermsSaved(true);
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setSavingPerms(false);
		}
	}

	async function handleDelete() {
		if (!confirm('Delete this role? This cannot be undone.')) return;
		setError('');
		try {
			await rolesService.remove(id);
			router.push('/roles');
		} catch (err) {
			setError(getApiError(err));
		}
	}

	if (currentUser?.role !== 'Admin') return null;
	if (loading) return <div className="loading-state">Loading role…</div>;
	if (!role && error) return <div className="form-error">{error}</div>;
	if (!role) return <div className="empty-state"><p>Role not found.</p></div>;

	return (
		<div>
			{/* Page header */}
			<div className="page-header">
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
					<button className="btn btn-ghost btn-sm" onClick={() => router.push('/roles')}>
						← Back
					</button>
					<div>
						<h1 className="page-title">
							<span className="badge badge-blue" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>
								{role.name}
							</span>
							Role
						</h1>
						<p className="page-subtitle">{role.description ?? 'No description'}</p>
					</div>
				</div>
			</div>

			{error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

			{/* Edit name / description */}
			<div className="card" style={{ marginBottom: '1rem' }}>
				<div className="card-header">Edit Details</div>
				<div className="card-body">
					<form onSubmit={handleUpdateRole}>
						<div className="form-row">
							<div className="form-group">
								<label className="form-label" htmlFor="name">Name</label>
								<input id="name" type="text" value={name}
									onChange={e => setName(e.target.value)} required disabled={saving} />
							</div>
							<div className="form-group">
								<label className="form-label" htmlFor="desc">Description</label>
								<input id="desc" type="text" value={description}
									onChange={e => setDescription(e.target.value)} disabled={saving} />
							</div>
						</div>
						<button type="submit" disabled={saving} className="btn btn-primary btn-sm">
							{saving ? 'Saving…' : 'Save Details'}
						</button>
					</form>
				</div>
			</div>

			{/* Permissions picker */}
			<div className="card" style={{ marginBottom: '1rem' }}>
				<div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<span>Permissions</span>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
						{permsSaved && (
							<span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Saved</span>
						)}
						<button
							className="btn btn-primary btn-sm"
							onClick={handleSavePerms}
							disabled={savingPerms}
						>
							{savingPerms ? 'Saving…' : 'Save Permissions'}
						</button>
					</div>
				</div>
				<div className="card-body">
					<p className="perm-section-hint">
						Click a permission to toggle it. Hit <strong>Save Permissions</strong> when done.
					</p>
					{allPerms.length === 0 ? (
						<div className="empty-state"><p>No permissions defined yet.</p></div>
					) : (
						<div className="perm-grid">
							{allPerms.map(p => (
								<button
									key={p.id}
									type="button"
									className={`perm-chip${selectedIds.has(p.id!) ? ' perm-chip-active' : ''}`}
									onClick={() => p.id != null && togglePerm(p.id)}
									title={p.description ?? ''}
								>
									{p.name}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Danger zone */}
			<div className="danger-zone">
				<div className="danger-zone-body">
					<div>
						<strong>Delete this role</strong>
						<p style={{ fontSize: '0.83rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
							This will permanently delete the role. Users assigned to it will lose their role.
						</p>
					</div>
					<button className="btn btn-danger btn-sm" onClick={handleDelete}>
						Delete Role
					</button>
				</div>
			</div>
		</div>
	);
}
