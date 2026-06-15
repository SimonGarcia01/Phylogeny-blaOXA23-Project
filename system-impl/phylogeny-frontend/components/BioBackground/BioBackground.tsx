'use client';

import { useId, useMemo } from 'react';

// ── Layout constants ──────────────────────────────────────────────────────────

const W = 1200;
const H = 800;

// Helix axis runs vertically in local space, then the group is rotated -32°
// so it goes diagonally bottom-right → top-left, matching the reference image.
const HELIX_CX = 620;   // horizontal center of the helix axis

const COMPACT_A = 75;   // backbone amplitude at the tight/compact end (bottom-right)
const BREAK_A   = 210;  // backbone amplitude at the unraveling end (top-left)

const PERIOD    = 290;  // px per full helix cycle
const Y_START   = -320; // extends above viewport for gapless composition
const Y_END     = 1180; // extends below viewport

// The "unraveling" zone occupies the top 40% of the helix span
const UNRAVEL_FRAC = 0.40;

// ── Amplitude varies along the helix ─────────────────────────────────────────
// Top (low y) = breaking/unraveling → large amplitude (strands pull apart)
// Bottom (high y) = compact/wound   → small amplitude (classic double helix)

function amplitudeAt(y: number): number {
    const span = Y_END - Y_START;
    // t goes 0 → 1 from top to bottom
    const t = (y - Y_START) / span;
    // breakFactor is 1 at the very top, fades to 0 at the unravel boundary
    const bf = Math.max(0, 1 - t / UNRAVEL_FRAC);
    // Smoothstep easing for a graceful transition
    const eased = bf * bf * (3 - 2 * bf);
    return COMPACT_A + (BREAK_A - COMPACT_A) * eased;
}

// ── Helix geometry ────────────────────────────────────────────────────────────

function buildHelix() {
    // — Backbone polylines —
    const pts1: string[] = [];
    const pts2: string[] = [];

    for (let y = Y_START; y <= Y_END; y += 2) {
        const angle = (2 * Math.PI * y) / PERIOD;
        const A = amplitudeAt(y);
        pts1.push(`${(HELIX_CX + A * Math.sin(angle)).toFixed(1)},${y}`);
        pts2.push(`${(HELIX_CX + A * Math.sin(angle + Math.PI)).toFixed(1)},${y}`);
    }

    // — Rung dots (base pairs) every half-period —
    const rungs: Array<{
        x1: number; x2: number; y: number;
        front: boolean; inUnravelZone: boolean;
    }> = [];

    const unravelBoundaryY = Y_START + (Y_END - Y_START) * UNRAVEL_FRAC;

    for (let y = Y_START; y <= Y_END; y += PERIOD / 2) {
        const angle = (2 * Math.PI * y) / PERIOD;
        const A = amplitudeAt(y);
        const x1 = HELIX_CX + A * Math.sin(angle);
        const x2 = HELIX_CX + A * Math.sin(angle + Math.PI);
        rungs.push({
            x1, x2, y,
            front: Math.sin(angle) > 0,
            inUnravelZone: y < unravelBoundaryY,
        });
    }

    // — Drifting dots at the unraveling end —
    // These are nucleotides that have "escaped" from the last few rungs.
    // They drift away from the strand endpoints with faint tether lines.
    type DriftDot = {
        cx: number; cy: number; r: number;
        fromX: number; fromY: number;
    };
    const driftDots: DriftDot[] = [];

    // Take the 6 rungs deepest in the unravel zone (closest to Y_START)
    const unravelRungs = rungs
        .filter(r => r.inUnravelZone)
        .slice(0, 6);

    unravelRungs.forEach((rung, i) => {
        // How far are we into the unravel zone? (0 = top/max-broken, 1 = boundary)
        const depth = (rung.y - Y_START) / (unravelBoundaryY - Y_START); // 0→1
        const escape = 60 * (1 - depth) + 12;   // escape distance: max at depth=0
        const dotR   = 6  + (1 - depth) * 5;    // larger dots at the far broken end

        // Strand-1-side dot drifts upward-left
        driftDots.push({
            cx: rung.x1 - escape * 0.85,
            cy: rung.y  - escape * 0.55,
            r: dotR,
            fromX: rung.x1, fromY: rung.y,
        });
        // Strand-2-side dot drifts downward-right
        driftDots.push({
            cx: rung.x2 + escape * 0.75,
            cy: rung.y  + escape * 0.50,
            r: dotR - 1.5,
            fromX: rung.x2, fromY: rung.y,
        });
    });

    return {
        pts1: pts1.join(' '),
        pts2: pts2.join(' '),
        rungs,
        driftDots,
        unravelBoundaryY,
    };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BioBackground() {
    const uid      = useId().replace(/:/g, '');
    const glowSm   = `glow-sm-${uid}`;
    const glowLg   = `glow-lg-${uid}`;
    const fadeGrad = `strand-fade-${uid}`;

    const helix = useMemo(() => buildHelix(), []);

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            preserveAspectRatio="xMidYMid slice"
            style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none', userSelect: 'none',
            }}
        >
            <defs>
                {/* Small glow — for regular base-pair dots */}
                <filter id={glowSm} x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="2.8" result="blur" in="SourceGraphic" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Large glow — for drifting/escaping dots at the unraveling end */}
                <filter id={glowLg} x="-150%" y="-150%" width="400%" height="400%">
                    <feGaussianBlur stdDeviation="6" result="blur" in="SourceGraphic" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/*
                  Vertical gradient in LOCAL (pre-rotation) space.
                  Fades the backbone strands to transparent at the unraveling end (top)
                  so they naturally dissolve as they break apart.
                */}
                <linearGradient
                    id={fadeGrad}
                    x1="0" y1={`${Y_START}`}
                    x2="0" y2={`${Y_END}`}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%"   stopColor="var(--accent)" stopOpacity="0"    />
                    <stop offset="18%"  stopColor="var(--accent)" stopOpacity="0.18" />
                    <stop offset="42%"  stopColor="var(--accent)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.22" />
                </linearGradient>
            </defs>

            {/*
              The whole helix is rotated -32° around the page centre
              so it runs diagonally from bottom-right (compact) to top-left (unraveling),
              matching the reference image's composition.
            */}
            <g
                transform={`rotate(-32 ${W / 2} ${H / 2})`}
                className="bio-helix-group"
            >
                {/* ── Teal sugar-phosphate backbones ── */}
                {/* Gradient stroke fades the strands out at the unraveling end */}
                <polyline
                    points={helix.pts1}
                    fill="none"
                    stroke={`url(#${fadeGrad})`}
                    strokeWidth="2.8"
                    strokeLinecap="round"
                />
                <polyline
                    points={helix.pts2}
                    fill="none"
                    stroke={`url(#${fadeGrad})`}
                    strokeWidth="2.8"
                    strokeLinecap="round"
                />

                {/* ── Rung connector lines (very faint gold) ── */}
                <g opacity="0.1">
                    {helix.rungs.map((r, i) => (
                        <line
                            key={i}
                            x1={r.x1} y1={r.y}
                            x2={r.x2} y2={r.y}
                            stroke="var(--accent-2)"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                        />
                    ))}
                </g>

                {/* ── Gold base-pair dots — the "steps" of the ladder ── */}
                <g filter={`url(#${glowSm})`} className="bio-dots">
                    {helix.rungs.map((r, i) => {
                        // Dots in the unravel zone are smaller and fainter (dissolving)
                        const scale   = r.inUnravelZone ? 0.72 : 1;
                        const opacity = r.front
                            ? (r.inUnravelZone ? 0.28 : 0.50)
                            : (r.inUnravelZone ? 0.10 : 0.18);
                        const dotR = 4.5 * scale;
                        return (
                            <g key={i} opacity={opacity}>
                                <circle cx={r.x1} cy={r.y} r={dotR} fill="var(--accent-2)" />
                                <circle cx={r.x2} cy={r.y} r={dotR} fill="var(--accent-2)" />
                            </g>
                        );
                    })}
                </g>

                {/* ── Tether lines from escaped dots back to the strand ── */}
                <g
                    stroke="var(--accent-2)"
                    strokeWidth="1"
                    strokeDasharray="2 5"
                    strokeLinecap="round"
                    opacity="0.18"
                >
                    {helix.driftDots.map((d, i) => (
                        <line
                            key={i}
                            x1={d.fromX} y1={d.fromY}
                            x2={d.cx}   y2={d.cy}
                        />
                    ))}
                </g>

                {/* ── Escaped / drifting nucleotide dots (stronger glow) ── */}
                <g filter={`url(#${glowLg})`} className="bio-dots-float">
                    {helix.driftDots.map((d, i) => (
                        <circle
                            key={i}
                            cx={d.cx} cy={d.cy} r={d.r}
                            fill="var(--accent-2)"
                            opacity="0.38"
                        />
                    ))}
                </g>
            </g>
        </svg>
    );
}
