import Link from 'next/link';

function Navbar() {
	return (
		<header>
			<nav>
				<Link href="/">Home</Link>
				<Link href="/about">About</Link>
				<Link href="/contact">Contact</Link>
				<Link href="/auth/login">Login</Link>
				<Link href="/auth/register">Register</Link>
				<Link href="/auth/logout">Logout</Link>
			</nav>
		</header>
	);
}

export default Navbar;
