import Link from 'next/link';
import './globals.css';

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<title>Phylogeny</title>
				<meta name="description" content="A tool for visualizing phylogenetic trees" />
				<Link rel="icon" href="/favicon.ico" />
			</head>
			<body>
				{/* Upper navbar on top of the page */}
				<header></header>
				{/* Main Content Area */}
				{children}
			</body>
		</html>
	);
}
