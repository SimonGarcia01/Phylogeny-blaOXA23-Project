'use client';

import { useState } from 'react';

export default function Page() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	function handleLogin(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		// Handle login logic here
	}

	return (
		<div>
			<h2>Login</h2>
			<form onSubmit={handleLogin}>
				<label htmlFor="email">Email:</label>
				<input
					type="email"
					id="email"
					name="email"
					placeholder="Enter your email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					required
				/>
				<br />
				<label htmlFor="password">Password:</label>
				<input
					type="password"
					id="password"
					name="password"
					placeholder="Enter your password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					required
				/>
				<br />
				<button type="submit">Login</button>
			</form>
		</div>
	);
}
