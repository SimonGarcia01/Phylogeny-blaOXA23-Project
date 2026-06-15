'use client';

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

	// Tree state
	const [treeContent, setTreeContent] = useState<string | null>(null);
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
		setTreeContent(null);
		setTreeError('');
		setTreeLoading(true);
		try {
			const content = await visualizationsService.getTree(id);
			setTreeContent(content);
		} catch (err) {
			setTreeError(getApiError(err));
		} finally {
			setTreeLoading(false);
		}
	}

	if (loading) return <p>Loading...</p>;
	if (!visualization && error) return <p style={{ color: 'red' }}>{error}</p>;
	if (!visualization) return <p>Visualization not found.</p>;

	const isReady = visualization.fileSize != null;

	return (
		<div>
			<h2>Visualization Detail</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}

			<p>Name: {visualization.name ?? '-'}</p>
			<p>Created: {visualization.createdAt ? new Date(visualization.createdAt).toLocaleDateString() : '-'}</p>
			<p>
				Status:{' '}
				{isReady ? (
					<strong>Ready</strong>
				) : (
					<em style={{ color: '#888' }}>Pending — analysis in progress</em>
				)}
			</p>
			<p>File Size: {isReady ? `${visualization.fileSize} bytes` : <em>pending</em>}</p>
			{visualization.relatedMatrixId && <p>Related Matrix: {visualization.relatedMatrixId}</p>}

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
			<h3>Phylogenetic Tree</h3>
			{isReady ? (
				<>
					<button onClick={handleSeeTree} disabled={treeLoading}>
						{treeLoading ? 'Loading tree...' : 'See Tree'}
					</button>
					{treeError && <p style={{ color: 'red' }}>{treeError}</p>}
					{treeContent !== null && (
						<pre
							style={{
								marginTop: '1rem',
								padding: '1rem',
								background: '#f4f4f4',
								border: '1px solid #ccc',
								overflowX: 'auto',
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-all',
								fontFamily: 'monospace',
								fontSize: '0.85rem',
							}}
						>
							{treeContent}
						</pre>
					)}
				</>
			) : (
				<p>
					<button disabled title="Analysis still in progress">
						See Tree
					</button>{' '}
					<em style={{ color: '#888' }}>Tree will be available once analysis completes.</em>
				</p>
			)}

			<hr />
			<button onClick={handleDelete}>Delete Visualization</button>
			<br />
			<br />
			<button onClick={() => router.push('/visualizations')}>Back to Visualizations</button>
		</div>
	);
}
