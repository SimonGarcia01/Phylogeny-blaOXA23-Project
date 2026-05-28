import Link from 'next/link';

function Navbar() {
	return (
		<header>
			<nav>
				<Link href="/">Home</Link>
				<Link href="/about">About</Link>
				<Link href="/contact">Contact</Link>
				<Link href="/login">Login</Link>
			</nav>
		</header>
	);
}

export default Navbar;
