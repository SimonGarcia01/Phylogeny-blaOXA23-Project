'use client';

import TreeVisualization from '@/components/TreeVisualization/TreeVisualization';
import { VisualizationDetail } from '@/interfaces/visualizations.interfaces';
import { getApiError } from '@/libs/errors';
import visualizationsService from '@/services/visualizations.service';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VisualizationDetailPage() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
	const router = useRouter();

	const [visualization, setVisualization] = useState<VisualizationDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	const [treeContent, setTreeContent] = useState<string | null>(null);
	const [showTree, setShowTree] = useState(false);
	const [treeLoading, setTreeLoading] = useState(false);
	const [treeError, setTreeError] = useState('');

	useEffect(() => {
		async function load() {
			try {
				const data = await visualizationsService.getOne(id);
				setVisualization(data);
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
			await visualizationsService.update(id, { name, description });
			const updated = await visualizationsService.getOne(id);
			setVisualization(updated);
			setName(updated.name ?? '');
			setDescription(updated.description ?? '');
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (!confirm('Delete this visualization?')) return;
		setError('');
		try {
			await visualizationsService.remove(id);
			router.push('/visualizations');
		} catch (err) {
			setError(getApiError(err));
		}
	}

	async function handleSeeTree() {
		setTreeError('');
		if (treeContent) { setShowTree(true); return; }
		setTreeLoading(true);
		try {
			const content = await visualizationsService.getTree(id);
			setTreeContent(content);
			setShowTree(true);
		} catch (err) {
			setTreeError(getApiError(err));
		} finally {
			setTreeLoading(false);
		}
	}

	if (loading) return <div className="loading-state">Loading…</div>;
	if (!visualization && error) return <div className="form-error" style={{ margin: '2rem' }}>{error}</div>;
	if (!visualization) return <div className="loading-state">Visualization not found.</div>;

	const isReady = visualization.fileSize != null;

	return (
		<div>
			<div className="page-header">
				<div>
					<h1 className="page-title">{visualization.name ?? 'Visualization'}</h1>
					<p className="page-subtitle">Visualization detail</p>
				</div>
				<button className="btn btn-secondary" onClick={() => router.push('/visualizations')}>
					← Back
				</button>
			</div>

			{error && <div className="form-error">{error}</div>}

			{/* Info */}
			<div className="card" style={{ marginBottom: '1.25rem' }}>
				<div className="card-header">Overview</div>
				<div className="card-body">
					<div className="info-grid">
						<div className="info-item">
							<div className="info-key">Status</div>
							<div className="info-val">
								{isReady ? (
									<span className="badge badge-green">Ready</span>
								) : (
									<span className="badge badge-gold">Pending</span>
								)}
							</div>
						</div>
						<div className="info-item">
							<div className="info-key">Created</div>
							<div className="info-val">
								{visualization.createdAt
									? new Date(visualization.createdAt).toLocaleString()
									: '—'}
							</div>
						</div>
						{visualization.relatedMatrixId && (
							<div className="info-item">
								<div className="info-key">Matrix</div>
								<div className="info-val">{visualization.relatedMatrixId}</div>
							</div>
						)}
						{isReady && (
							<div className="info-item">
								<div className="info-key">File Size</div>
								<div className="info-val">{visualization.fileSize?.toLocaleString()} bytes</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Tree */}
			<div className="card" style={{ marginBottom: '1.25rem' }}>
				<div className="card-header">Phylogenetic Tree</div>
				<div className="card-body">
					{isReady ? (
						<>
							<p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
								Interactive SVG phylogram with proportional branch lengths and bootstrap
								support values. Click any internal node to reroot.
							</p>
							<button
								className="btn btn-primary"
								onClick={handleSeeTree}
								disabled={treeLoading}
							>
								{treeLoading ? 'Loading tree…' : 'See Tree'}
							</button>
							{treeError && (
								<div className="form-error" style={{ marginTop: '0.75rem' }}>{treeError}</div>
							)}
						</>
					) : (
						<p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', margin: 0 }}>
							The tree will be available once the RAxML-NG analysis completes.
						</p>
					)}
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
				<p>Deleting a visualization cannot be undone.</p>
				<button className="btn btn-danger" onClick={handleDelete}>
					Delete Visualization
				</button>
			</div>

			{showTree && treeContent && (
				<TreeVisualization newick={treeContent} onClose={() => setShowTree(false)} />
			)}
		</div>
	);
}
