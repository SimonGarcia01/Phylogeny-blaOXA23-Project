'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface TreeNode {
    id: string;
    name: string;
    support?: number;
    length: number;
    children: TreeNode[];
    x: number;
    y: number;
}

// ── Newick Parser ────────────────────────────────────────────────────────────
// Handles RAxML-NG format: ((A:0.01,B:0.02)85:0.03,(C:0.04,D:0.05)90:0.06);
// Support values appear as numeric node labels on internal nodes.

let _uid = 0;
function uid(): string {
    return `n${++_uid}`;
}

function parseNewick(raw: string): TreeNode {
    const s = raw.trim().replace(/;$/, '');
    let i = 0;

    function parseNode(): TreeNode {
        let children: TreeNode[] = [];

        if (s[i] === '(') {
            i++; // consume '('
            children.push(parseNode());
            while (i < s.length && s[i] === ',') {
                i++;
                children.push(parseNode());
            }
            if (s[i] === ')') i++; // consume ')'
        }

        // Optional label (taxon name or support value for internal nodes)
        let label = '';
        while (i < s.length && s[i] !== ':' && s[i] !== ',' && s[i] !== ')' && s[i] !== ';') {
            label += s[i++];
        }
        label = label.trim();

        // Optional branch length after ':'
        let length = 0;
        if (i < s.length && s[i] === ':') {
            i++;
            let lenStr = '';
            while (i < s.length && s[i] !== ',' && s[i] !== ')' && s[i] !== ';') {
                lenStr += s[i++];
            }
            length = parseFloat(lenStr) || 0;
        }

        // Numeric label on an internal node = support value; otherwise it's a name
        const numLabel = label !== '' ? Number(label) : NaN;
        const isSupport = children.length > 0 && !isNaN(numLabel);

        return {
            id: uid(),
            name: isSupport ? '' : label,
            support: isSupport ? numLabel : undefined,
            length,
            children,
            x: 0,
            y: 0,
        };
    }

    return parseNode();
}

// ── Tree Layout (phylogram) ──────────────────────────────────────────────────

function assignY(node: TreeNode, counter: { n: number }): void {
    if (node.children.length === 0) {
        node.y = counter.n++;
    } else {
        for (const c of node.children) assignY(c, counter);
        node.y = (node.children[0].y + node.children[node.children.length - 1].y) / 2;
    }
}

function assignX(node: TreeNode, parentX: number): void {
    node.x = parentX + node.length;
    for (const c of node.children) assignX(c, node.x);
}

function deepMaxX(node: TreeNode): number {
    if (node.children.length === 0) return node.x;
    return Math.max(...node.children.map(deepMaxX));
}

function tipCount(node: TreeNode): number {
    if (node.children.length === 0) return 1;
    return node.children.reduce((s, c) => s + tipCount(c), 0);
}

function layoutTree(root: TreeNode): void {
    // Root always sits at x=0; children accumulate from there
    root.x = 0;
    for (const c of root.children) assignX(c, 0);
    assignY(root, { n: 0 });
}

// ── Clone & Reroot ───────────────────────────────────────────────────────────

function cloneTree(node: TreeNode): TreeNode {
    return { ...node, children: node.children.map(cloneTree) };
}

function findPath(node: TreeNode, targetId: string, path: TreeNode[]): boolean {
    path.push(node);
    if (node.id === targetId) return true;
    for (const c of node.children) {
        if (findPath(c, targetId, path)) return true;
    }
    path.pop();
    return false;
}

function rerootAt(root: TreeNode, targetId: string): TreeNode {
    const clone = cloneTree(root);
    const path: TreeNode[] = [];
    if (!findPath(clone, targetId, path) || path.length <= 1) return clone;

    // Reverse the parent→child relationships along the path
    for (let k = 0; k < path.length - 1; k++) {
        const parent = path[k];
        const child = path[k + 1];
        parent.children = parent.children.filter((c) => c.id !== child.id);
        parent.length = child.length; // reversed edge keeps the same length
        child.children.push(parent);
    }
    const newRoot = path[path.length - 1];
    newRoot.length = 0;
    return newRoot;
}

// ── SVG Layout Constants ──────────────────────────────────────────────────────

const ROW_H = 22;       // vertical pixels between consecutive tips
const TIP_PAD = 10;     // gap between tip dot and its label
const TIP_LABEL_W = 220; // reserved width for taxon names
const LEFT_M = 24;      // left margin (space before root)
const TOP_M = 20;       // top margin
const BRANCH_PX = 600;  // total pixel width of the branch area
const SCALE_AREA = 44;  // space at bottom for the scale bar

// ── "Nice" scale-bar value helper ─────────────────────────────────────────────

function niceNum(x: number): number {
    if (x <= 0) return 0.001;
    const e = Math.pow(10, Math.floor(Math.log10(x)));
    const f = x / e;
    const n = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
    return n * e;
}

function fmtLen(v: number): string {
    if (v === 0) return '0';
    if (Math.abs(v) < 0.001 || Math.abs(v) >= 10000) return v.toExponential(2);
    // Trim trailing zeros
    return parseFloat(v.toPrecision(4)).toString();
}

// ── Build SVG elements recursively ───────────────────────────────────────────

function buildElems(
    node: TreeNode,
    scaleX: number,
    parentPxX: number | null,
    isRoot: boolean,
    onReroot: (id: string) => void,
): React.ReactNode[] {
    const pxX = LEFT_M + node.x * scaleX;
    const pxY = TOP_M + node.y * ROW_H;
    const elems: React.ReactNode[] = [];

    // ── Horizontal branch line (not drawn for root itself)
    if (parentPxX !== null) {
        elems.push(
            <line key={`h${node.id}`} x1={parentPxX} y1={pxY} x2={pxX} y2={pxY}
                stroke="#222" strokeWidth={1.5} />,
        );
    }

    if (node.children.length > 0) {
        // ── Vertical connector spanning all children
        const topY = TOP_M + node.children[0].y * ROW_H;
        const botY = TOP_M + node.children[node.children.length - 1].y * ROW_H;
        elems.push(
            <line key={`v${node.id}`} x1={pxX} y1={topY} x2={pxX} y2={botY}
                stroke="#222" strokeWidth={1.5} />,
        );

        // ── Support value — anchored to the RIGHT of the parent junction,
        //    shifted left of the node circle so it's not covered by it.
        if (node.support !== undefined && !isRoot && parentPxX !== null) {
            const midX = parentPxX + (pxX - parentPxX) * 0.15 + 2; // near the left end of the branch
            elems.push(
                <text key={`s${node.id}`} x={midX} y={pxY - 4}
                    textAnchor="start" fontSize={10} fill="#888" fontFamily="sans-serif">
                    {node.support % 1 === 0 ? node.support : node.support.toFixed(2)}
                </text>,
            );
        }

        // ── "root" label in red italic next to the root node
        if (isRoot) {
            elems.push(
                <text key="root-lbl" x={pxX + 6} y={pxY - 9}
                    fontSize={11} fontStyle="italic" fill="#b00" fontFamily="sans-serif">
                    root
                </text>,
            );
        }

        // ── Clickable circle at internal node
        const clickable = !isRoot;
        elems.push(
            <circle key={`nd${node.id}`}
                cx={pxX} cy={pxY} r={5}
                fill={isRoot ? '#b00' : '#fff'}
                stroke={isRoot ? '#900' : '#555'}
                strokeWidth={1.5}
                style={{ cursor: clickable ? 'pointer' : 'default' }}
                onClick={() => { if (clickable) onReroot(node.id); }}
            >
                {clickable && <title>Reroot tree at this node</title>}
            </circle>,
        );

        // ── Recurse into children
        for (const child of node.children) {
            elems.push(...buildElems(child, scaleX, pxX, false, onReroot));
        }
    } else {
        // ── Leaf: small dot + taxon label
        elems.push(
            <circle key={`dot${node.id}`} cx={pxX} cy={pxY} r={3} fill="#222" />,
            <text key={`lbl${node.id}`} x={pxX + TIP_PAD} y={pxY}
                dominantBaseline="middle" fontSize={12} fontFamily="monospace" fill="#111">
                {node.name}
            </text>,
        );
    }

    return elems;
}

// ── Main Component ────────────────────────────────────────────────────────────

interface TreeVisualizationProps {
    newick: string;
    onClose: () => void;
}

export default function TreeVisualization({ newick, onClose }: TreeVisualizationProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [root, setRoot] = useState<TreeNode | null>(null);
    const [parseError, setParseError] = useState('');

    useEffect(() => {
        _uid = 0;
        try {
            const parsed = parseNewick(newick);
            setRoot(parsed);
            setParseError('');
        } catch (e) {
            setParseError(String(e));
        }
    }, [newick]);

    const handleReroot = useCallback((nodeId: string) => {
        setRoot((prev) => (prev ? rerootAt(prev, nodeId) : prev));
    }, []);

    // Opens a print-to-PDF dialog in a new tab with just the SVG
    const handleDownloadPDF = useCallback(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const svgStr = new XMLSerializer().serializeToString(svg);
        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Phylogenetic Tree</title>
<style>
  body { margin: 0; padding: 0; background: white; }
  svg { display: block; max-width: 100%; }
  @media print {
    body { margin: 0; }
    @page { size: landscape; margin: 1cm; }
  }
</style>
</head>
<body>
${svgStr}
<script>
  window.addEventListener('load', function () { window.print(); });
</script>
</body>
</html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) {
            win.addEventListener('load', () => URL.revokeObjectURL(url));
        } else {
            URL.revokeObjectURL(url);
            alert('Please allow pop-ups so the PDF dialog can open.');
        }
    }, []);

    // ── Compute SVG synchronously from current root state
    let svgElement: React.ReactNode = null;

    if (root) {
        // Clone so layout mutations don't touch React state
        const tree = cloneTree(root);
        layoutTree(tree);

        const nTips = tipCount(tree);
        const maxTreeX = deepMaxX(tree);
        const scaleX = maxTreeX > 0 ? BRANCH_PX / maxTreeX : BRANCH_PX;

        const svgW = LEFT_M + BRANCH_PX + TIP_PAD + TIP_LABEL_W;
        const svgH = TOP_M + nTips * ROW_H + SCALE_AREA;

        // Scale bar
        const barVal = niceNum(maxTreeX / 5);
        const barPxW = barVal * scaleX;
        const barY = svgH - 18;
        const barX = LEFT_M;

        const treeElems = buildElems(tree, scaleX, null, true, handleReroot);

        svgElement = (
            <svg ref={svgRef}
                width={svgW} height={svgH}
                viewBox={`0 0 ${svgW} ${svgH}`}
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block' }}
            >
                <rect width={svgW} height={svgH} fill="white" />
                {treeElems}
                {/* Scale bar */}
                <line x1={barX} y1={barY} x2={barX + barPxW} y2={barY} stroke="#444" strokeWidth={1.5} />
                <line x1={barX} y1={barY - 4} x2={barX} y2={barY + 4} stroke="#444" strokeWidth={1.5} />
                <line x1={barX + barPxW} y1={barY - 4} x2={barX + barPxW} y2={barY + 4} stroke="#444" strokeWidth={1.5} />
                <text x={barX + barPxW / 2} y={barY + 15}
                    textAnchor="middle" fontSize={11} fill="#444" fontFamily="sans-serif">
                    {fmtLen(barVal)}
                </text>
                <text x={barX} y={barY + 15}
                    fontSize={10} fill="#888" fontFamily="sans-serif">
                    substitutions/site
                </text>
            </svg>
        );
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '1rem',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                padding: '1.25rem 1.5rem',
                width: '92vw', maxWidth: 1200,
                maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '0.75rem', flexShrink: 0,
                    borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem',
                }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>
                        Phylogenetic Tree
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={handleDownloadPDF}>
                            Download / Print PDF
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
                    </div>
                </div>

                {!parseError && root && (
                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--ink-muted)', flexShrink: 0 }}>
                        Click any white circle (internal node) to reroot the tree.{' '}
                        <span style={{ color: '#b00', fontWeight: 500 }}>Red circle</span> = current root.
                        Branch lengths are proportional. Support values appear along each branch.
                    </p>
                )}

                {/* Scrollable SVG area */}
                <div style={{ overflow: 'auto', flex: 1 }}>
                    {parseError && (
                        <p style={{ color: '#dc2626' }}>Failed to parse Newick: {parseError}</p>
                    )}
                    {!parseError && !root && (
                        <p style={{ color: 'var(--ink-muted)' }}>Parsing tree…</p>
                    )}
                    {svgElement}
                </div>
            </div>
        </div>
    );
}
