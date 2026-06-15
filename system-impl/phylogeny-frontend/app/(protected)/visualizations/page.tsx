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

	if (loading) return <p>Loading...</p>;

	return (
		<div>
			<h2>Visualizations</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<button onClick={() => { setShowAnalyze(!showAnalyze); setError(''); }}>
				{showAnalyze ? 'Cancel' : 'Start Analysis'}
			</button>

			{showAnalyze && (
				<form onSubmit={handleAnalyze}>
					<div>
						<label htmlFor="matrixId">Select Matrix:</label>
						<select
							id="matrixId"
							value={selectedMatrixId}
							onChange={(e) => setSelectedMatrixId(e.target.value)}
							required
							disabled={analyzing}
						>
							<option value="">-- Select a matrix --</option>
							{matrices.map((m) => (
								<option key={m.matrixId} value={m.matrixId}>
									{m.name ?? m.matrixId}
								</option>
							))}
						</select>
					</div>
					<button type="submit" disabled={analyzing}>
						{analyzing ? 'Starting...' : 'Analyze'}
					</button>
				</form>
			)}

			<br />
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Created At</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{visualizations.map((v) => {
						const ready = v.fileSize != null;
						return (
							<tr key={v.visualizationId}>
								<td>
									{ready ? (
										<Link href={`/visualizations/${v.visualizationId}`}>
											{v.name ?? v.visualizationId}
										</Link>
									) : (
										<span>{v.name ?? v.visualizationId} <em>(pending)</em></span>
									)}
								</td>
								<td>{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '-'}</td>
								<td>
									{ready ? (
										<>
											<Link href={`/visualizations/${v.visualizationId}`}>Edit</Link>
											{' | '}
											<button onClick={() => handleDelete(v.visualizationId)}>Delete</button>
										</>
									) : (
										<span title="Analysis still in progress">-</span>
									)}
								</td>
							</tr>
						);
					})}
					{visualizations.length === 0 && (
						<tr>
							<td colSpan={3}>No visualizations found.</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
