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
		async function load() {
			try { setPermissions(await permissionsService.getAll()); }
			catch (err) { setError(getApiError(err)); }
			finally { setLoading(false); }
		}
		load();
	}, [user?.role, router]);

	async function reload() {
		try { setPermissions(await permissionsService.getAll()); } catch (err) { setError(getApiError(err)); }
	}

	async function handleDelete(id: number) {
		if (!confirm('Delete this permission?')) return;
		setError('');
		try { await permissionsService.remove(id); await reload(); } catch (err) { setError(getApiError(err)); }
	}

	async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError('');
		try {
			setCreating(true);
			await permissionsService.create({ name, description: description || undefined } as CreatePermissionRequest);
			setShowCreate(false); setName(''); setDescription('');
			await reload();
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setCreating(false);
		}
	}

	if (user?.role !== 'Admin') return null;
	if (loading) return <div className="loading-state">Loading permissions…</div>;

	// Group permissions by prefix (e.g. USERS_READ → group "USERS")
	const groups: Record<string, PermissionListItem[]> = {};
	permissions.forEach(p => {
		const prefix = p.name?.split('_')[0] ?? 'OTHER';
		if (!groups[prefix]) groups[prefix] = [];
		groups[prefix].push(p);
	});

	return (
		<div>
			<div className="page-header">
				<div>
					<h1 className="page-title">Permissions</h1>
					<p className="page-subtitle">
						{permissions.length} permission{permissions.length !== 1 ? 's' : ''} across {Object.keys(groups).length} resource{Object.keys(groups).length !== 1 ? 's' : ''}
					</p>
				</div>
				<button
					className={showCreate ? 'btn btn-secondary' : 'btn btn-primary'}
					onClick={() => { setShowCreate(!showCreate); setError(''); }}
				>
					{showCreate ? 'Cancel' : '+ Create Permission'}
				</button>
			</div>

			{error && <div className="form-error">{error}</div>}

			{showCreate && (
				<div className="create-panel">
					<p className="create-panel-title">New Permission</p>
					<form onSubmit={handleCreate}>
						<div className="form-row">
							<div className="form-group">
								<label className="form-label" htmlFor="name">Key (e.g. USERS_CREATE)</label>
								<input id="name" type="text" value={name}
									onChange={e => setName(e.target.value.toUpperCase())} required disabled={creating}
									style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} />
							</div>
							<div className="form-group">
								<label className="form-label" htmlFor="description">Description</label>
								<input id="description" type="text" value={description}
									onChange={e => setDescription(e.target.value)} disabled={creating} />
							</div>
						</div>
						<button type="submit" disabled={creating} className="btn btn-primary">
							{creating ? 'Creating…' : 'Create Permission'}
						</button>
					</form>
				</div>
			)}

			{permissions.length === 0 ? (
				<div className="empty-state"><p>No permissions defined yet.</p></div>
			) : (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
					{Object.entries(groups).map(([group, perms]) => (
						<div key={group} className="card">
							<div className="card-header">
								<span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
									{group}
								</span>
								<span className="badge badge-blue" style={{ marginLeft: '0.5rem' }}>{perms.length}</span>
							</div>
							<div className="card-body">
								<div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
									{perms.map((p, i) => (
										<div key={p.id ?? p.name ?? i}
											style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
											<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
												<span style={{
													fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600,
													background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
													color: 'var(--accent)', borderRadius: '4px', padding: '0.2rem 0.5rem',
													whiteSpace: 'nowrap',
												}}>
													{p.name}
												</span>
												{p.description && (
													<span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
														{p.description}
													</span>
												)}
											</div>
											{p.id != null && (
												<div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
													<Link href={`/permissions/${p.id}`} className="btn btn-ghost btn-sm">Edit</Link>
													<button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id!)}>Delete</button>
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
