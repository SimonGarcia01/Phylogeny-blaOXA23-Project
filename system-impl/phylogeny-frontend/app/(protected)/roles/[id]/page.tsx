'use client';

import { RoleListItem } from '@/interfaces/roles.interfaces';
import { getApiError } from '@/libs/errors';
import rolesService from '@/services/roles.service';
import { useAuthStore } from '@/stores/auth.store';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RoleDetailPage() {
	const params = useParams();
	const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
	const router = useRouter();
	const currentUser = useAuthStore((store) => store.user);

	const [role, setRole] = useState<RoleListItem | null>(null);
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
				const data = await rolesService.getOne(id);
				setRole(data);
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

	async function handleDelete() {
		if (!confirm('Delete this role?')) return;
		setError('');
		try {
			await rolesService.remove(id);
			router.push('/roles');
		} catch (err) {
			setError(getApiError(err));
		}
	}

	if (currentUser?.role !== 'Admin') return null;
	if (loading) return <p>Loading...</p>;
	if (!role && error) return <p style={{ color: 'red' }}>{error}</p>;
	if (!role) return <p>Role not found.</p>;

	return (
		<div>
			<h2>Role Detail</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<p>Name: {role.name}</p>
			{role.permissions && role.permissions.length > 0 && (
				<p>Permissions: {role.permissions.join(', ')}</p>
			)}
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
			<button onClick={handleDelete}>Delete Role</button>
			<br />
			<br />
			<button onClick={() => router.push('/roles')}>Back to Roles</button>
		</div>
	);
}
