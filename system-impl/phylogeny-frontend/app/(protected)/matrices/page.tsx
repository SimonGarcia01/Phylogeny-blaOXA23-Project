'use client';

import { MatrixListItem } from '@/interfaces/matrices.interfaces';
import { getApiError } from '@/libs/errors';
import matricesService from '@/services/matrices.service';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function MatricesPage() {
	const [matrices, setMatrices] = useState<MatrixListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const fileInputRef = useRef<HTMLInputElement>(null);

	async function loadMatrices() {
		try {
			const data = await matricesService.getAll();
			setMatrices(data);
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadMatrices();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	async function handleDelete(id: string) {
		if (!confirm('Delete this matrix?')) return;
		setError('');
		try {
			await matricesService.remove(id);
			await loadMatrices();
		} catch (err) {
			setError(getApiError(err));
		}
	}

	async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!file) return;
		setError('');
		try {
			setUploading(true);

			// Upload goes through the Next.js API route so the server (inside Docker)
			// can reach minio:9000 directly with the presigned URL — no hostname issue.
			const token = useAuthStore.getState().token;
			const formData = new FormData();
			formData.append('file', file);
			formData.append('name', name);
			if (description) formData.append('description', description);

			const response = await fetch('/api/matrices/upload', {
				method: 'POST',
				headers: { Authorization: `Bearer ${token ?? ''}` },
				body: formData,
			});

			if (!response.ok) {
				const data = await response.json().catch(() => null);
				const msg = data?.message ?? `Upload failed: ${response.status}`;
				throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
			}

			setShowCreate(false);
			setName('');
			setDescription('');
			setFile(null);
			if (fileInputRef.current) fileInputRef.current.value = '';
			await loadMatrices();
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setUploading(false);
		}
	}

	if (loading) return <p>Loading...</p>;

	return (
		<div>
			<h2>Matrices</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<button onClick={() => { setShowCreate(!showCreate); setError(''); }}>
				{showCreate ? 'Cancel' : 'Upload Matrix'}
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
							disabled={uploading}
						/>
					</div>
					<div>
						<label htmlFor="description">Description:</label>
						<input
							id="description"
							type="text"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={uploading}
						/>
					</div>
					<div>
						<label htmlFor="file">File (.nex only):</label>
						<input
							ref={fileInputRef}
							id="file"
							type="file"
							accept=".nex"
							onChange={(e) => setFile(e.target.files?.[0] ?? null)}
							required
							disabled={uploading}
						/>
					</div>
					<button type="submit" disabled={uploading}>
						{uploading ? 'Uploading...' : 'Upload'}
					</button>
				</form>
			)}

			<br />
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Uploaded At</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{matrices.map((m) => (
						<tr key={m.matrixId}>
							<td>
								<Link href={`/matrices/${m.matrixId}`}>{m.name ?? m.matrixId}</Link>
							</td>
							<td>{m.uploadedAt ? new Date(m.uploadedAt).toLocaleDateString() : '-'}</td>
							<td>
								<Link href={`/matrices/${m.matrixId}`}>Edit</Link>
								{' | '}
								<button onClick={() => handleDelete(m.matrixId)}>Delete</button>
							</td>
						</tr>
					))}
					{matrices.length === 0 && (
						<tr>
							<td colSpan={3}>No matrices found.</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
