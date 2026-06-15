'use client';

import { MatrixDetail } from '@/interfaces/matrices.interfaces';
import { getApiError } from '@/libs/errors';
import matricesService from '@/services/matrices.service';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MatrixDetailPage() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
	const router = useRouter();

	const [matrix, setMatrix] = useState<MatrixDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		async function load() {
			try {
				const data = await matricesService.getOne(id);
				setMatrix(data);
				setName(data.name ?? '');
				setDescription(data.description ?? '');
			} catch (err) {
				setError(getApiError(err));
			} finally {
				setLoading(false);
			}
		}
		load();
	}, [id]);

	async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		try {
			setSaving(true);
			await matricesService.update(id, { name, description });
			const updated = await matricesService.getOne(id);
			setMatrix(updated);
			setName(updated.name ?? '');
			setDescription(updated.description ?? '');
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (!confirm('Delete this matrix?')) return;
		setError('');
		try {
			await matricesService.remove(id);
			router.push('/matrices');
		} catch (err) {
			setError(getApiError(err));
		}
	}

	if (loading) return <p>Loading...</p>;
	if (!matrix && error) return <p style={{ color: 'red' }}>{error}</p>;
	if (!matrix) return <p>Matrix not found.</p>;

	return (
		<div>
			<h2>Matrix Detail</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<p>ID: {matrix.matrixId}</p>
			<p>Uploaded: {matrix.uploadedAt ? new Date(matrix.uploadedAt).toLocaleDateString() : '-'}</p>
			<p>File Size: {matrix.fileSize != null ? `${matrix.fileSize} bytes` : '-'}</p>
			{matrix.relatedVisualizationId && <p>Related Visualization: {matrix.relatedVisualizationId}</p>}
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
			<button onClick={handleDelete}>Delete Matrix</button>
			<br />
			<br />
			<button onClick={() => router.push('/matrices')}>Back to Matrices</button>
		</div>
	);
}
