'use client';

import { AuthUser } from '@/interfaces/auth.interfaces';
import matricesService from '@/services/matrices.service';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect } from 'react';



export default function GeneralDashboardPage() {
	const user: AuthUser | null = useAuthStore((store) => store.user);

	useEffect({
		let numberOfMatrices: number;
		let numberOfVisualizations: number;
	},[]);

	return (
		<div>
			<h2>
				Welcome {user?.firstName} {user?.lastName}!
			</h2>
			<p>Currently you have:</p>
			<ul>
				<li>{user?.role==="admin" ?  `Number of uploaded matrices in the system: ${numberOfMatrices}` : `Number of matrices you've uploaded: ${numberOfMatrices}` </li>
				<li>Number of generated visualizations: {numberOfVisualizations}</li>
                <li>{/* If its an admin show the number of users*/} </li>
				<li>{/* If its an admin show the number of roles*/} </li>
				<li>{/* If its an admin show the number of permissions*/} </li>
			</ul>
		</div>
	);
}
