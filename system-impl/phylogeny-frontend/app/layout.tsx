import Navbar from '@/components/Navbar/Navbar';
import './globals.css';

export const metadata = {
	title: 'PhyloGen',
	description: 'Streamlined phylogenetic analysis and visualization for researchers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<Navbar />
				<main>{children}</main>
			</body>
		</html>
	);
}
