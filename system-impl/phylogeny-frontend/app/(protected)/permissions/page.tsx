'use client';

import { CreatePermissionRequest, PermissionListItem } from '@/interfaces/permissions.interfaces';
import { getApiError } from '@/libs/errors';
import permissionsService from '@/services/permissions.service';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PermissionsPage() {
	const user = useAuthStore((store) => store.user);
	const router = useRouter();

	const [permissions, setPermissions] = useState<PermissionListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (user?.role !== 'Admin') {
			router.replace('/dashboard');
			return;
		}

		async function loadPermissions() {
			try {
				const data = await permissionsService.getAll();
				setPermissions(data);
			} catch (err) {
				setError(getApiError(err));
			} finally {
				setLoading(false);
			}
		}

		loadPermissions();
	}, [user?.role, router]);

	async function reloadPermissions() {
		try {
			const data = await permissionsService.getAll();
			setPermissions(data);
		} catch (err) {
			setError(getApiError(err));
		}
	}

	async function handleDelete(id: number) {
		if (!confirm('Delete this permission?')) return;
		setError('');
		try {
			await permissionsService.remove(id);
			await reloadPermissions();
		} catch (err) {
			setError(getApiError(err));
		}
	}

	async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		try {
			setCreating(true);
			const dto: CreatePermissionRequest = { name, description: description || undefined };
			await permissionsService.create(dto);
			setShowCreate(false);
			setName('');
			setDescription('');
			await reloadPermissions();
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
			<h2>Permissions</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<button onClick={() => { setShowCreate(!showCreate); setError(''); }}>
				{showCreate ? 'Cancel' : 'Create Permission'}
			</button>

			{showCreate && (
				<form onSubmit={handleCreate}>
					<div>
						<label htmlFor="name">Name:</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							disabled={creating}
						/>
					</div>
					<div>
						<label htmlFor="description">Description:</label>
						<input
							id="description"
							type="text"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={creating}
						/>
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
						<th>Name</th>
						<th>Description</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{permissions.map((p, index) => (
						<tr key={p.id ?? p.name ?? index}>
							<td>{p.name}</td>
							<td>{p.description ?? '-'}</td>
							<td>
								{p.id != null ? (
									<>
										<Link href={`/permissions/${p.id}`}>Edit</Link>
										{' | '}
										<button onClick={() => handleDelete(p.id!)}>Delete</button>
									</>
								) : (
									'-'
								)}
							</td>
						</tr>
					))}
					{permissions.length === 0 && (
						<tr>
							<td colSpan={3}>No permissions found.</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
