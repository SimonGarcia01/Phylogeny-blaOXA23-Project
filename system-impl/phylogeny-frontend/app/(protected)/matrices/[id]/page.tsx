'use client';

import { MatrixDetail } from '@/interfaces/matrices.interfaces';
import { getApiError } from '@/libs/errors';
import matricesService from '@/services/matrices.service';
import Link from 'next/link';
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

	if (loading) return <div className="loading-state">Loading…</div>;
	if (!matrix && error) return <div className="form-error" style={{ margin: '2rem' }}>{error}</div>;
	if (!matrix) return <div className="loading-state">Matrix not found.</div>;

	return (
		<div>
			<div className="page-header">
				<div>
					<h1 className="page-title">{matrix.name ?? 'Matrix'}</h1>
					<p className="page-subtitle">Sequence alignment matrix</p>
				</div>
				<button className="btn btn-secondary" onClick={() => router.push('/matrices')}>
					← Back
				</button>
			</div>

			{error && <div className="form-error">{error}</div>}

			{/* Info */}
			<div className="card" style={{ marginBottom: '1.25rem' }}>
				<div className="card-header">Details</div>
				<div className="card-body">
					<div className="info-grid">
						<div className="info-item">
							<div className="info-key">Uploaded</div>
							<div className="info-val">
								{matrix.uploadedAt ? new Date(matrix.uploadedAt).toLocaleString() : '—'}
							</div>
						</div>
						<div className="info-item">
							<div className="info-key">File Size</div>
							<div className="info-val">
								{matrix.fileSize != null ? `${matrix.fileSize.toLocaleString()} bytes` : '—'}
							</div>
						</div>
						{matrix.relatedVisualizationId && (
							<div className="info-item">
								<div className="info-key">Visualization</div>
								<div className="info-val">
									<Link href={`/visualizations/${matrix.relatedVisualizationId}`}>
										View
									</Link>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Edit */}
			<div className="card" style={{ marginBottom: '1.25rem' }}>
				<div className="card-header">Edit Details</div>
				<div className="card-body">
					<form onSubmit={handleUpdate}>
						<div className="form-group">
							<label className="form-label" htmlFor="name">Name</label>
							<input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={saving}
							/>
						</div>
						<div className="form-group">
							<label className="form-label" htmlFor="description">Description</label>
							<input
								id="description"
								type="text"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								disabled={saving}
							/>
						</div>
						<button type="submit" disabled={saving} className="btn btn-primary">
							{saving ? 'Saving…' : 'Save Changes'}
						</button>
					</form>
				</div>
			</div>

			{/* Danger zone */}
			<div className="danger-zone">
				<div className="danger-zone-title">Danger Zone</div>
				<p>Deleting this matrix will permanently remove the file from storage.</p>
				<button className="btn btn-danger" onClick={handleDelete}>
					Delete Matrix
				</button>
			</div>
		</div>
	);
}
