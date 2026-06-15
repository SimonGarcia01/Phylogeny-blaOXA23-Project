'use client';

import { useState } from 'react';

type Tab = 'background' | 'howto';

export default function AboutPage() {
	const [activeTab, setActiveTab] = useState<Tab>('background');

	return (
		<div className="about-wrapper">
			<div className="about-header">
				<h1 className="page-title">About PhyloGen</h1>
				<p style={{ color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
					The story behind the tool and how to use it.
				</p>
			</div>

			<div className="tab-bar">
				<button
					className={`tab-btn${activeTab === 'background' ? ' tab-btn-active' : ''}`}
					onClick={() => setActiveTab('background')}
				>
					Project Background
				</button>
				<button
					className={`tab-btn${activeTab === 'howto' ? ' tab-btn-active' : ''}`}
					onClick={() => setActiveTab('howto')}
				>
					How to Use
				</button>
			</div>

			{activeTab === 'background' && (
				<div className="prose">
					<h3>Origin &amp; Motivation</h3>
					<p>
						PhyloGen grew out of a graduate thesis studying{' '}
						<em>Acinetobacter baumannii</em>, one of the most clinically important
						multidrug-resistant pathogens on the WHO priority list. The research focused
						specifically on the <strong>blaOXA-23</strong> carbapenemase gene — a major
						driver of carbapenem resistance that has complicated the treatment of
						nosocomial infections worldwide.
					</p>
					<p>
						Reconstructing the evolutionary history of blaOXA-23 across diverse{' '}
						<em>A. baumannii</em> isolates required maximum-likelihood phylogenetics.
						The process involved cleaning raw sequence data, preparing NEXUS alignment
						matrices, running RAxML-NG, and then separately visualizing the resulting
						Newick trees — often juggling three or four different applications just to
						complete a single analysis cycle.
					</p>

					<h3>The Problem It Solves</h3>
					<p>
						Every iteration of the workflow meant manually moving files between tools,
						losing track of which matrix produced which tree, and repeating the same
						copy-paste steps. PhyloGen was designed to collapse this workflow into a
						single, reproducible platform: upload a matrix, trigger the analysis, and
						explore the results — without leaving the browser.
					</p>

					<h3>Scientific Context</h3>
					<p>
						<em>Acinetobacter baumannii</em> is a gram-negative opportunistic pathogen
						responsible for a growing proportion of hospital-acquired infections,
						particularly in ICU settings. The blaOXA-23 gene encodes a class D
						beta-lactamase that confers resistance to carbapenems — the antibiotics of
						last resort — making treatment options extremely limited.
					</p>
					<p>
						Phylogenetic analysis of blaOXA-23 sequences helps researchers trace
						horizontal gene transfer events, understand clonal spread across geographic
						regions, and identify genetic diversity within outbreak clusters. PhyloGen
						provides the computational infrastructure to perform this kind of analysis
						efficiently and reproducibly.
					</p>
				</div>
			)}

			{activeTab === 'howto' && (
				<div>
					<p style={{ color: 'var(--ink-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
						Follow these steps to go from a cleaned sequence alignment to an interactive
						phylogenetic tree.
					</p>
					<ol className="step-list">
						<li className="step-item">
							<div className="step-num">1</div>
							<div className="step-content">
								<h4>Create an account</h4>
								<p>
									Sign up with your email address. You will be assigned the
									Researcher role, which gives you access to matrix upload and
									visualization features.
								</p>
							</div>
						</li>
						<li className="step-item">
							<div className="step-num">2</div>
							<div className="step-content">
								<h4>Upload a sequence matrix</h4>
								<p>
									Go to <strong>Matrices</strong> and click{' '}
									<strong>Upload Matrix</strong>. Select your cleaned alignment
									file in NEXUS (.nex) format, give it a descriptive name, and
									submit. The file is stored securely in MinIO.
								</p>
							</div>
						</li>
						<li className="step-item">
							<div className="step-num">3</div>
							<div className="step-content">
								<h4>Start a phylogenetic analysis</h4>
								<p>
									Go to <strong>Visualizations</strong> and click{' '}
									<strong>Start Analysis</strong>. Choose the matrix you uploaded
									and submit. PhyloGen queues a RAxML-NG maximum-likelihood run in
									the background.
								</p>
							</div>
						</li>
						<li className="step-item">
							<div className="step-num">4</div>
							<div className="step-content">
								<h4>Wait for the analysis to complete</h4>
								<p>
									Your visualization appears in the list immediately, marked as{' '}
									<em>(pending)</em>. Refresh after a few minutes — once the
									RAxML-NG job finishes, the tree becomes available.
								</p>
							</div>
						</li>
						<li className="step-item">
							<div className="step-num">5</div>
							<div className="step-content">
								<h4>Explore the phylogenetic tree</h4>
								<p>
									Open the visualization and click <strong>See Tree</strong>. An
									interactive SVG phylogram will appear with proportional branch
									lengths and bootstrap support values. Click any internal node to
									reroot the tree at that position.
								</p>
							</div>
						</li>
						<li className="step-item">
							<div className="step-num">6</div>
							<div className="step-content">
								<h4>Export as PDF</h4>
								<p>
									Inside the tree viewer, click{' '}
									<strong>Download / Print PDF</strong>. A print dialog opens in a
									new tab formatted for landscape output. Use your browser&apos;s
									print-to-PDF feature to save.
								</p>
							</div>
						</li>
					</ol>
				</div>
			)}
		</div>
	);
}
