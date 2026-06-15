'use client';

import { PermissionListItem } from '@/interfaces/permissions.interfaces';
import { getApiError } from '@/libs/errors';
import permissionsService from '@/services/permissions.service';
import { useAuthStore } from '@/stores/auth.store';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PermissionDetailPage() {
	const params = useParams();
	const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
	const router = useRouter();
	const currentUser = useAuthStore((store) => store.user);

	const [permission, setPermission] = useState<PermissionListItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (currentUser?.role !== 'Admin') {
			router.replace('/dashboard');
			return;
		}

		async function load() {
			try {
				const data = await permissionsService.getOne(id);
				setPermission(data);
				setName(data.name ?? '');
				setDescription(data.description ?? '');
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
			await permissionsService.update(id, { name, description: description || undefined });
			const updated = await permissionsService.getOne(id);
			setPermission(updated);
			setName(updated.name ?? '');
			setDescription(updated.description ?? '');
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (!confirm('Delete this permission?')) return;
		setError('');
		try {
			await permissionsService.remove(id);
			router.push('/permissions');
		} catch (err) {
			setError(getApiError(err));
		}
	}

	if (currentUser?.role !== 'Admin') return null;
	if (loading) return <p>Loading...</p>;
	if (!permission && error) return <p style={{ color: 'red' }}>{error}</p>;
	if (!permission) return <p>Permission not found.</p>;

	return (
		<div>
			<h2>Permission Detail</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<p>Name: {permission.name}</p>
			<hr />
			<h3>Edit</h3>
			<form onSubmit={handleUpdate}>
				<div>
					<label htmlFor="name">Name:</label>
					<input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						disabled={saving}
					/>
				</div>
				<div>
					<label htmlFor="description">Description:</label>
					<input
						id="description"
						type="text"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						disabled={saving}
					/>
				</div>
				<button type="submit" disabled={saving}>
					{saving ? 'Saving...' : 'Save'}
				</button>
			</form>
			<hr />
			<button onClick={handleDelete}>Delete Permission</button>
			<br />
			<br />
			<button onClick={() => router.push('/permissions')}>Back to Permissions</button>
		</div>
	);
}
