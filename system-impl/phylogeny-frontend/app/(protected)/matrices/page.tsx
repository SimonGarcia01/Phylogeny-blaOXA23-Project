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

	if (loading) return <div className="loading-state">Loading matrices…</div>;

	return (
		<div>
			<div className="page-header">
				<div>
					<h1 className="page-title">Matrices</h1>
					<p className="page-subtitle">Manage your sequence alignment files</p>
				</div>
				<button
					className={showCreate ? 'btn btn-secondary' : 'btn btn-primary'}
					onClick={() => { setShowCreate(!showCreate); setError(''); }}
				>
					{showCreate ? 'Cancel' : 'Upload Matrix'}
				</button>
			</div>

			{error && <div className="form-error">{error}</div>}

			{showCreate && (
				<div className="create-panel">
					<p className="create-panel-title">New Matrix</p>
					<form onSubmit={handleCreate}>
						<div className="form-row">
							<div className="form-group">
								<label className="form-label" htmlFor="name">Name</label>
								<input
									id="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. blaOXA-23 alignment"
									required
									disabled={uploading}
								/>
							</div>
							<div className="form-group">
								<label className="form-label" htmlFor="description">Description (optional)</label>
								<input
									id="description"
									type="text"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Short description"
									disabled={uploading}
								/>
							</div>
						</div>
						<div className="form-group">
							<label className="form-label" htmlFor="file">NEXUS File (.nex)</label>
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
						<button type="submit" disabled={uploading} className="btn btn-primary">
							{uploading ? 'Uploading…' : 'Upload'}
						</button>
					</form>
				</div>
			)}

			<div className="card">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Uploaded At</th>
							<th style={{ width: '120px' }}>Actions</th>
						</tr>
					</thead>
					<tbody>
						{matrices.map((m) => (
							<tr key={m.matrixId}>
								<td>
									<Link href={`/matrices/${m.matrixId}`} style={{ fontWeight: 500 }}>
										{m.name ?? m.matrixId}
									</Link>
								</td>
								<td style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
									{m.uploadedAt ? new Date(m.uploadedAt).toLocaleDateString() : '—'}
								</td>
								<td>
									<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
										<Link href={`/matrices/${m.matrixId}`} className="btn btn-ghost btn-sm">
											Edit
										</Link>
										<button
											className="btn btn-danger btn-sm"
											onClick={() => handleDelete(m.matrixId)}
										>
											Delete
										</button>
									</div>
								</td>
							</tr>
						))}
						{matrices.length === 0 && (
							<tr>
								<td colSpan={3}>
									<div className="empty-state">
										<p>No matrices yet. Upload your first alignment file to get started.</p>
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
