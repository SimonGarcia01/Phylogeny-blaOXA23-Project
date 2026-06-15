'use client';

import BioBackground from '@/components/BioBackground/BioBackground';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';

export default function Home() {
	const token = useAuthStore((s) => s.token);

	return (
		<div className="bio-page">
			<BioBackground />

			<div className="bio-page-content">
				{/* ── Hero ── */}
				<section className="hero">
					<span className="hero-eyebrow">
						Phylogenetic Analysis Tool
					</span>
					<h1 className="hero-title">
						Make sense of your sequences with{' '}
						<span className="accent-text">PhyloGen</span>
					</h1>
					<p className="hero-subtitle">
						Upload your sequence alignment, run RAxML-NG analysis, and explore
						interactive phylogenetic trees — all in one streamlined platform.
					</p>
					<div className="hero-cta">
						{token ? (
							<Link href="/dashboard" className="btn btn-primary btn-lg">
								Go to Dashboard
							</Link>
						) : (
							<>
								<Link href="/auth/signup" className="btn btn-primary btn-lg">
									Get Started
								</Link>
								<Link href="/auth/login" className="btn btn-secondary btn-lg">
									Sign In
								</Link>
							</>
						)}
						<Link href="/about" className="btn btn-ghost btn-lg">
							Learn More
						</Link>
					</div>
				</section>

				{/* ── Features ── */}
				<section className="features-section">
					<h2 className="section-heading">Everything you need for phylogenetics</h2>
					<p className="section-subheading">
						A complete workflow — from raw alignments to publication-ready trees.
					</p>
					<div className="features-grid">
						<div className="feature-card">
							<div className="feature-icon">🧬</div>
							<h3 className="feature-title">Matrix Management</h3>
							<p className="feature-desc">
								Upload and manage your sequence alignment matrices in NEXUS format.
								Secure storage in MinIO keeps your data organized and accessible.
							</p>
						</div>
						<div className="feature-card">
							<div className="feature-icon">🌿</div>
							<h3 className="feature-title">RAxML-NG Analysis</h3>
							<p className="feature-desc">
								Submit matrices for maximum-likelihood phylogenetic analysis powered
								by RAxML-NG. Track progress in real time and receive results
								automatically.
							</p>
						</div>
						<div className="feature-card">
							<div className="feature-icon">🔬</div>
							<h3 className="feature-title">Interactive Tree Viewer</h3>
							<p className="feature-desc">
								Explore Newick phylograms with proportional branch lengths and
								bootstrap support values. Click any node to reroot the tree and
								export as PDF.
							</p>
						</div>
					</div>
				</section>

				{/* ── CTA Band ── */}
				<section className="cta-band">
					<h2>Ready to start analyzing?</h2>
					<p>
						PhyloGen was built to replace the fragmented post-cleaning workflow with a
						single, reproducible tool.
					</p>
					{token ? (
						<Link href="/dashboard" className="btn btn-gold btn-lg">
							Open Dashboard
						</Link>
					) : (
						<Link href="/auth/signup" className="btn btn-gold btn-lg">
							Create a free account
						</Link>
					)}
				</section>
			</div>
		</div>
	);
}
