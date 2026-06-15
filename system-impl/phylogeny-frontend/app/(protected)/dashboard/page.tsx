'use client';

import { AdminDashboardStats, DashboardStats } from '@/interfaces/dashboard.interfaces';
import dashboardService from '@/services/dashboard.service';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function GeneralDashboardPage() {
	const user = useAuthStore((s) => s.user);
	const isAdmin = user?.role === 'Admin';

	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadStats() {
			try {
				if (isAdmin) {
					setAdminStats(await dashboardService.getAdminDashboard());
				} else {
					setStats(await dashboardService.getMyDashboard());
				}
			} catch (error) {
				console.error('Failed to load dashboard stats:', error);
			} finally {
				setLoading(false);
			}
		}
		loadStats();
	}, [isAdmin]);

	if (loading) return <div className="loading-state">Loading dashboard…</div>;

	if (isAdmin && adminStats) {
		return (
			<div>
				<div className="page-header">
					<div>
						<h1 className="page-title">Admin Dashboard</h1>
						<p className="page-subtitle">
							Welcome back, {user?.firstName} {user?.lastName}
						</p>
					</div>
					<span className="badge badge-gold">Admin</span>
				</div>

				<div className="stats-grid">
					<div className="stat-card">
						<div className="stat-value">{adminStats.totalUsers}</div>
						<div className="stat-label">Total Users</div>
					</div>
					<div className="stat-card stat-card-accent-2">
						<div className="stat-value stat-value-2">{adminStats.totalMatrices}</div>
						<div className="stat-label">Matrices</div>
					</div>
					<div className="stat-card">
						<div className="stat-value">{adminStats.totalVisualizations}</div>
						<div className="stat-label">Visualizations</div>
					</div>
					<div className="stat-card stat-card-accent-2">
						<div className="stat-value stat-value-2">{adminStats.totalMatrixRequestsToday}</div>
						<div className="stat-label">Requests Today</div>
					</div>
					<div className="stat-card">
						<div className="stat-value">{adminStats.totalRoles}</div>
						<div className="stat-label">Roles</div>
					</div>
					<div className="stat-card stat-card-accent-2">
						<div className="stat-value stat-value-2">{adminStats.totalPermissions}</div>
						<div className="stat-label">Permissions</div>
					</div>
				</div>

				<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
					<Link href="/users" className="btn btn-secondary">Manage Users</Link>
					<Link href="/matrices" className="btn btn-secondary">Matrices</Link>
					<Link href="/visualizations" className="btn btn-secondary">Visualizations</Link>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="page-header">
				<div>
					<h1 className="page-title">Dashboard</h1>
					<p className="page-subtitle">
						Welcome back, {user?.firstName} {user?.lastName}
					</p>
				</div>
			</div>

			{stats && (
				<>
					<div className="stats-grid">
						<div className="stat-card">
							<div className="stat-value">{stats.totalMatrices}</div>
							<div className="stat-label">My Matrices</div>
						</div>
						<div className="stat-card stat-card-accent-2">
							<div className="stat-value stat-value-2">{stats.totalVisualizations}</div>
							<div className="stat-label">Visualizations</div>
						</div>
						<div className="stat-card">
							<div className="stat-value">{stats.activeRequests.length}</div>
							<div className="stat-label">Active Requests</div>
						</div>
						<div className="stat-card stat-card-accent-2">
							<div className="stat-value stat-value-2">{stats.failedRequests.length}</div>
							<div className="stat-label">Failed Requests</div>
						</div>
					</div>

					<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
						<Link href="/matrices" className="btn btn-primary">Upload Matrix</Link>
						<Link href="/visualizations" className="btn btn-secondary">Visualizations</Link>
					</div>

					{stats.activeRequests.length > 0 && (
						<div className="card" style={{ marginBottom: '1rem' }}>
							<div className="card-header">
								Active Requests
								<span className="badge badge-blue">{stats.activeRequests.length}</span>
							</div>
							<div className="card-body" style={{ padding: 0 }}>
								<table>
									<tbody>
										{stats.activeRequests.map((req) => (
											<tr key={req.id}>
												<td>{req.name}</td>
												<td>
													<span className="badge badge-gold">{req.status}</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{stats.failedRequests.length > 0 && (
						<div className="card">
							<div className="card-header">
								Failed Requests
								<span className="badge badge-red">{stats.failedRequests.length}</span>
							</div>
							<div className="card-body" style={{ padding: 0 }}>
								<table>
									<tbody>
										{stats.failedRequests.map((req) => (
											<tr key={req.id}>
												<td>{req.name}</td>
												<td>
													<span className="badge badge-red">{req.status}</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
