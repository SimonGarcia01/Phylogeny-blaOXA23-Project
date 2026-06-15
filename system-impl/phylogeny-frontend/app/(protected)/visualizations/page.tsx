'use client';

import { MatrixListItem } from '@/interfaces/matrices.interfaces';
import { VisualizationListItem } from '@/interfaces/visualizations.interfaces';
import { getApiError } from '@/libs/errors';
import matricesService from '@/services/matrices.service';
import visualizationsService from '@/services/visualizations.service';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function VisualizationsPage() {
	const [visualizations, setVisualizations] = useState<VisualizationListItem[]>([]);
	const [matrices, setMatrices] = useState<MatrixListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAnalyze, setShowAnalyze] = useState(false);
	const [selectedMatrixId, setSelectedMatrixId] = useState('');
	const [analyzing, setAnalyzing] = useState(false);
	const [error, setError] = useState('');

	async function loadData() {
		try {
			const [vData, mData] = await Promise.all([
				visualizationsService.getAll(),
				matricesService.getAll(),
			]);
			setVisualizations(vData);
			setMatrices(mData);
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadData();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	async function handleDelete(id: string) {
		if (!confirm('Delete this visualization?')) return;
		setError('');
		try {
			await visualizationsService.remove(id);
			await loadData();
		} catch (err) {
			setError(getApiError(err));
		}
	}

	async function handleAnalyze(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		try {
			setAnalyzing(true);
			await visualizationsService.analyze({ matrixId: selectedMatrixId });
			setShowAnalyze(false);
			setSelectedMatrixId('');
			await loadData();
		} catch (err) {
			setError(getApiError(err));
		} finally {
			setAnalyzing(false);
		}
	}

	if (loading) return <div className="loading-state">Loading visualizations…</div>;

	return (
		<div>
			<div className="page-header">
				<div>
					<h1 className="page-title">Visualizations</h1>
					<p className="page-subtitle">Phylogenetic tree analyses from your matrices</p>
				</div>
				<button
					className={showAnalyze ? 'btn btn-secondary' : 'btn btn-primary'}
					onClick={() => { setShowAnalyze(!showAnalyze); setError(''); }}
				>
					{showAnalyze ? 'Cancel' : 'Start Analysis'}
				</button>
			</div>

			{error && <div className="form-error">{error}</div>}

			{showAnalyze && (
				<div className="create-panel">
					<p className="create-panel-title">New Analysis</p>
					<form onSubmit={handleAnalyze}>
						<div className="form-group">
							<label className="form-label" htmlFor="matrixId">Select Matrix</label>
							<select
								id="matrixId"
								value={selectedMatrixId}
								onChange={(e) => setSelectedMatrixId(e.target.value)}
								required
								disabled={analyzing}
							>
								<option value="">— Choose a matrix —</option>
								{matrices.map((m) => (
									<option key={m.matrixId} value={m.matrixId}>
										{m.name ?? m.matrixId}
									</option>
								))}
							</select>
						</div>
						<button type="submit" disabled={analyzing} className="btn btn-primary">
							{analyzing ? 'Starting…' : 'Run Analysis'}
						</button>
					</form>
				</div>
			)}

			<div className="card">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Status</th>
							<th>Created At</th>
							<th style={{ width: '140px' }}>Actions</th>
						</tr>
					</thead>
					<tbody>
						{visualizations.map((v) => {
							const ready = v.fileSize != null;
							return (
								<tr key={v.visualizationId}>
									<td style={{ fontWeight: 500 }}>
										{ready ? (
											<Link href={`/visualizations/${v.visualizationId}`}>
												{v.name ?? v.visualizationId}
											</Link>
										) : (
											<span style={{ color: 'var(--ink-muted)' }}>
												{v.name ?? v.visualizationId}
											</span>
										)}
									</td>
									<td>
										{ready ? (
											<span className="badge badge-green">Ready</span>
										) : (
											<span className="badge badge-gold">Pending</span>
										)}
									</td>
									<td style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
										{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}
									</td>
									<td>
										{ready ? (
											<div style={{ display: 'flex', gap: '0.5rem' }}>
												<Link
													href={`/visualizations/${v.visualizationId}`}
													className="btn btn-ghost btn-sm"
												>
													Open
												</Link>
												<button
													className="btn btn-danger btn-sm"
													onClick={() => handleDelete(v.visualizationId)}
												>
													Delete
												</button>
											</div>
										) : (
											<span
												className="badge badge-muted"
												title="Analysis still in progress"
											>
												Pending
											</span>
										)}
									</td>
								</tr>
							);
						})}
						{visualizations.length === 0 && (
							<tr>
								<td colSpan={4}>
									<div className="empty-state">
										<p>No analyses yet. Start one by selecting a matrix above.</p>
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
