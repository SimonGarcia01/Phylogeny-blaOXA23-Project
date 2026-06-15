'use client';

import { CreateRoleRequest, RoleListItem } from '@/interfaces/roles.interfaces';
import { getApiError } from '@/libs/errors';
import rolesService from '@/services/roles.service';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RolesPage() {
	const user = useAuthStore((store) => store.user);
	const router = useRouter();

	const [roles, setRoles] = useState<RoleListItem[]>([]);
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

		async function loadRoles() {
			try {
				const data = await rolesService.getAll();
				setRoles(data);
			} catch (err) {
				setError(getApiError(err));
			} finally {
				setLoading(false);
			}
		}

		loadRoles();
	}, [user?.role, router]);

	async function reloadRoles() {
		try {
			const data = await rolesService.getAll();
			setRoles(data);
		} catch (err) {
			setError(getApiError(err));
		}
	}

	async function handleDelete(id: number) {
		if (!confirm('Delete this role?')) return;
		setError('');
		try {
			await rolesService.remove(id);
			await reloadRoles();
		} catch (err) {
			setError(getApiError(err));
		}
	}

	async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		try {
			setCreating(true);
			const dto: CreateRoleRequest = { name, description: description || undefined };
			await rolesService.create(dto);
			setShowCreate(false);
			setName('');
			setDescription('');
			await reloadRoles();
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
			<h2>Roles</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<button onClick={() => { setShowCreate(!showCreate); setError(''); }}>
				{showCreate ? 'Cancel' : 'Create Role'}
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
					{roles.map((r, index) => (
						<tr key={r.id ?? r.name ?? index}>
							<td>{r.name}</td>
							<td>{r.description ?? '-'}</td>
							<td>
								{r.id != null ? (
									<>
										<Link href={`/roles/${r.id}`}>Edit</Link>
										{' | '}
										<button onClick={() => handleDelete(r.id!)}>Delete</button>
									</>
								) : (
									'-'
								)}
							</td>
						</tr>
					))}
					{roles.length === 0 && (
						<tr>
							<td colSpan={3}>No roles found.</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
