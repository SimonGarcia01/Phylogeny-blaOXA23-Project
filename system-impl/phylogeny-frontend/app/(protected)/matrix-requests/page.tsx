'use client';

import { MatrixRequestListItem } from '@/interfaces/matrix-requests.interfaces';
import matrixRequestsService from '@/services/matrices-request.service';
import { useEffect, useState } from 'react';

export default function MatrixRequestsPage() {
	const [requests, setRequests] = useState<MatrixRequestListItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				const data = await matrixRequestsService.getAll();
				setRequests(data);
			} catch (error) {
				console.error('Failed to load matrix requests:', error);
			} finally {
				setLoading(false);
			}
		}
		load();
	}, []);

	if (loading) return <p>Loading...</p>;

	return (
		<div>
			<h2>Matrix Requests</h2>
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Name</th>
						<th>Status</th>
						<th>Requested At</th>
						<th>Finished At</th>
					</tr>
				</thead>
				<tbody>
					{requests.map((r) => (
						<tr key={r.id}>
							<td>{r.id}</td>
							<td>{r.name}</td>
							<td>{r.status}</td>
							<td>{new Date(r.requestedAt).toLocaleDateString()}</td>
							<td>{r.finishedAt ? new Date(r.finishedAt).toLocaleDateString() : '-'}</td>
						</tr>
					))}
					{requests.length === 0 && (
						<tr>
							<td colSpan={5}>No matrix requests found.</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
