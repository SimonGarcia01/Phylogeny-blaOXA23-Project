import './globals.css';

export const metadata = {
	title: 'Phylogeny',
	description: 'A tool for generating and visualizing phylogenetic trees',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
