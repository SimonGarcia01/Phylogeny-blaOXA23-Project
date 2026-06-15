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
		async function load() {
			try { setRoles(await rolesService.getAll()); }
			catch (err) { setError(getApiError(err)); }
			finally { setLoading(false); }
		}
		load();
	}, [user?.role, router]);

	async function reload() {
		try { setRoles(await rolesService.getAll()); } catch (err) { setError(getApiError(err)); }
	}

	async function handleDelete(id: number) {
		if (!confirm('Delete this role?')) return;
		setError('');
		try { await rolesService.remove(id); await reload(); } catch (err) { setError(getApiError(err)); }
	}

	async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError('');
		try {
			setCreating(true);
			await rolesService.create({ name, description: description || undefined } as CreateRoleRequest);
			setShowCreate(false); setName(''); setDescription('');
			await reload();
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
					<p className="page-subtitle">Manage user roles and their permissions</p>
				</div>
				<button
					className={showCreate ? 'btn btn-secondary' : 'btn btn-primary'}
					onClick={() => { setShowCreate(!showCreate); setError(''); }}
				>
					{showCreate ? 'Cancel' : '+ Create Role'}
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
									onChange={e => setName(e.target.value)} required disabled={creating} />
							</div>
							<div className="form-group">
								<label className="form-label" htmlFor="description">Description</label>
								<input id="description" type="text" value={description}
									onChange={e => setDescription(e.target.value)} disabled={creating} />
							</div>
						</div>
						<button type="submit" disabled={creating} className="btn btn-primary">
							{creating ? 'Creating…' : 'Create Role'}
						</button>
					</form>
				</div>
			)}

			{roles.length === 0 ? (
				<div className="empty-state"><p>No roles found.</p></div>
			) : (
				<div className="role-grid">
					{roles.map((r, i) => (
						<div key={r.id ?? r.name ?? i} className="role-card">
							<div>
								<span className="badge badge-blue">{r.name}</span>
							</div>
							<p className="role-card-desc">{r.description ?? 'No description'}</p>
							<div className="role-card-footer">
								{r.id != null ? (
									<>
										<Link href={`/roles/${r.id}`} className="btn btn-ghost btn-sm">
											Edit &amp; Permissions
										</Link>
										<button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id!)}>
											Delete
										</button>
									</>
								) : '—'}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
