'use client';

import { MatrixRequestListItem } from '@/interfaces/matrix-requests.interfaces';
import matrixRequestsService from '@/services/matrices-request.service';
import { useEffect, useState } from 'react';

function statusBadge(status: string) {
	if (status === 'completed') return <span className="badge badge-green">{status}</span>;
	if (status === 'failed') return <span className="badge badge-red">{status}</span>;
	return <span className="badge badge-gold">{status}</span>;
}

export default function MatrixRequestsPage() {
	const [requests, setRequests] = useState<MatrixRequestListItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				setRequests(await matrixRequestsService.getAll());
			} catch (error) {
				console.error('Failed to load matrix requests:', error);
			} finally {
				setLoading(false);
			}
		}
		load();
	}, []);

	if (loading) return <div className="loading-state">Loading requests…</div>;

	return (
		<div>
			<div className="page-header">
				<div>
					<h1 className="page-title">Matrix Requests</h1>
					<p className="page-subtitle">RAxML-NG analysis job history</p>
				</div>
			</div>

			<div className="card">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Status</th>
							<th>Requested At</th>
							<th>Finished At</th>
						</tr>
					</thead>
					<tbody>
						{requests.map((r) => (
							<tr key={r.id}>
								<td style={{ fontWeight: 500 }}>{r.name}</td>
								<td>{statusBadge(r.status)}</td>
								<td style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
									{new Date(r.requestedAt).toLocaleString()}
								</td>
								<td style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
									{r.finishedAt ? new Date(r.finishedAt).toLocaleString() : '—'}
								</td>
							</tr>
						))}
						{requests.length === 0 && (
							<tr>
								<td colSpan={4}>
									<div className="empty-state"><p>No analysis requests yet.</p></div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
