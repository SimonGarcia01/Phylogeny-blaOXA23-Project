'use client';

import { AdminDashboardStats, DashboardStats } from '@/interfaces/dashboard.interfaces';
import dashboardService from '@/services/dashboard.service';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect, useState } from 'react';

export default function GeneralDashboardPage() {
	const user = useAuthStore((store) => store.user);
	const isAdmin = user?.role === 'Admin';

	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadStats() {
			try {
				if (isAdmin) {
					const data = await dashboardService.getAdminDashboard();
					setAdminStats(data);
				} else {
					const data = await dashboardService.getMyDashboard();
					setStats(data);
				}
			} catch (error) {
				console.error('Failed to load dashboard stats:', error);
			} finally {
				setLoading(false);
			}
		}

		loadStats();
	}, [isAdmin]);

	if (loading) return <p>Loading...</p>;

	if (isAdmin && adminStats) {
		return (
			<div>
				<h2>Admin Dashboard</h2>
				<p>
					Welcome {user?.firstName} {user?.lastName}!
				</p>
				<ul>
					<li>Total Users: {adminStats.totalUsers}</li>
					<li>Total Roles: {adminStats.totalRoles}</li>
					<li>Total Permissions: {adminStats.totalPermissions}</li>
					<li>Total Matrices: {adminStats.totalMatrices}</li>
					<li>Total Visualizations: {adminStats.totalVisualizations}</li>
					<li>Matrix Requests Today: {adminStats.totalMatrixRequestsToday}</li>
				</ul>
			</div>
		);
	}

	return (
		<div>
			<h2>Dashboard</h2>
			<p>
				Welcome {user?.firstName} {user?.lastName}!
			</p>
			{stats && (
				<>
					<ul>
						<li>Total Matrices: {stats.totalMatrices}</li>
						<li>Total Visualizations: {stats.totalVisualizations}</li>
						<li>Active Requests: {stats.activeRequests.length}</li>
						<li>Failed Requests: {stats.failedRequests.length}</li>
					</ul>
					{stats.activeRequests.length > 0 && (
						<div>
							<h3>Active Requests</h3>
							<ul>
								{stats.activeRequests.map((req) => (
									<li key={req.id}>
										{req.name} — {req.status}
									</li>
								))}
							</ul>
						</div>
					)}
					{stats.failedRequests.length > 0 && (
						<div>
							<h3>Failed Requests</h3>
							<ul>
								{stats.failedRequests.map((req) => (
									<li key={req.id}>
										{req.name} — {req.status}
									</li>
								))}
							</ul>
						</div>
					)}
				</>
			)}
		</div>
	);
}
