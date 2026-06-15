'use client';

import { useEffect, useId, useRef } from 'react';

// ── Geometry constants ────────────────────────────────────────────────────────

const W = 1200;
const H = 800;
const HELIX_CX   = 620;
const COMPACT_A  = 78;
const BREAK_A    = 215;
const PERIOD     = 290;
const Y_START    = -320;
const Y_END      = 1180;
const UNRAVEL_FRAC = 0.42;
const PHASE_PERIOD_MS = 48000;

const SPARKLES = [
    { cx: HELIX_CX - 192, cy: -248, r: 1.9 },
    { cx: HELIX_CX + 78,  cy: -172, r: 2.3 },
    { cx: HELIX_CX - 258, cy:  -88, r: 1.5 },
    { cx: HELIX_CX + 148, cy:  -14, r: 2.7 },
    { cx: HELIX_CX - 126, cy:   44, r: 1.6 },
    { cx: HELIX_CX + 208, cy:  118, r: 2.1 },
    { cx: HELIX_CX - 296, cy:  182, r: 1.4 },
    { cx: HELIX_CX + 64,  cy:  232, r: 2.5 },
    { cx: HELIX_CX - 168, cy:  302, r: 1.8 },
    { cx: HELIX_CX + 238, cy:  338, r: 1.3 },
    { cx: HELIX_CX - 224, cy:  418, r: 1.7 },
    { cx: HELIX_CX + 158, cy:  478, r: 2.0 },
];

// ── Amplitude (variable along the helix axis) ─────────────────────────────────

function amplitudeAt(y: number): number {
    const span = Y_END - Y_START;
    const t  = (y - Y_START) / span;
    const bf = Math.max(0, 1 - t / UNRAVEL_FRAC);
    const sm = bf * bf * (3 - 2 * bf);
    return COMPACT_A + (BREAK_A - COMPACT_A) * sm;
}

// ── Dynamic backbone — updated every frame ────────────────────────────────────

function buildBackbone(phase: number): [string, string] {
    let p1 = '';
    let p2 = '';
    for (let y = Y_START; y <= Y_END; y += 2) {
        const a = (2 * Math.PI * y) / PERIOD + phase;
        const A = amplitudeAt(y);
        const s = Math.sin(a);
        p1 += `${(HELIX_CX + A * s).toFixed(1)},${y} `;
        p2 += `${(HELIX_CX - A * s).toFixed(1)},${y} `;
    }
    return [p1, p2];
}

// ── Dynamic rungs, dots & tethers — updated every 2nd frame ──────────────────
// Rung positions are computed at the current phase so they track the strands.

function buildDynamicSVG(
    phase: number,
    glowSm: string,
    glowMd: string,
    glowLg: string,
): string {
    const unravelBoundaryY = Y_START + (Y_END - Y_START) * UNRAVEL_FRAC;

    type Rung = { x1: number; x2: number; y: number; front: boolean; inUnravelZone: boolean };
    const rungs: Rung[] = [];

    for (let y = Y_START; y <= Y_END; y += PERIOD / 2) {
        const a = (2 * Math.PI * y) / PERIOD + phase;
        const A = amplitudeAt(y);
        const s = Math.sin(a);
        rungs.push({
            x1: HELIX_CX + A * s,
            x2: HELIX_CX - A * s,
            y,
            front: s > 0,
            inUnravelZone: y < unravelBoundaryY,
        });
    }

    type Dot = { cx: number; cy: number; r: number; fx: number; fy: number };
    const driftDots: Dot[] = [];
    const driftDots2: Dot[] = [];

    const unravelRungs = rungs.filter(r => r.inUnravelZone).slice(0, 12);

    unravelRungs.forEach((rung, i) => {
        const depth = (rung.y - Y_START) / (unravelBoundaryY - Y_START);
        const esc1  = 70 * (1 - depth) + 14;
        const r1    = 7 + (1 - depth) * 5;

        const p1L: Dot = { cx: rung.x1 - esc1 * 0.90, cy: rung.y - esc1 * 0.58, r: r1,       fx: rung.x1, fy: rung.y };
        const p1R: Dot = { cx: rung.x2 + esc1 * 0.82, cy: rung.y + esc1 * 0.52, r: r1 - 1.5, fx: rung.x2, fy: rung.y };
        driftDots.push(p1L, p1R);

        if (i < 6) {
            const esc2 = esc1 * 1.65;
            const r2   = r1 * 0.55;
            driftDots2.push(
                { cx: p1L.cx - esc2 * 0.70, cy: p1L.cy - esc2 * 0.80, r: r2,       fx: p1L.cx, fy: p1L.cy },
                { cx: p1R.cx + esc2 * 0.62, cy: p1R.cy + esc2 * 0.72, r: r2 * 0.8, fx: p1R.cx, fy: p1R.cy },
            );
        }
    });

    let s = '';

    // Rung connector lines
    s += '<g opacity="0.09">';
    for (const r of rungs) {
        s += `<line x1="${r.x1.toFixed(1)}" y1="${r.y}" x2="${r.x2.toFixed(1)}" y2="${r.y}" stroke="var(--accent-2)" stroke-width="1.4" stroke-linecap="round"/>`;
    }
    s += '</g>';

    // Gold base-pair dots
    s += `<g filter="url(#${glowSm})">`;
    for (const r of rungs) {
        const inU  = r.inUnravelZone;
        const dotR = inU ? 3.2 : 4.6;
        const opac = r.front ? (inU ? 0.28 : 0.52) : (inU ? 0.10 : 0.18);
        s += `<g opacity="${opac}">`;
        s += `<circle cx="${r.x1.toFixed(1)}" cy="${r.y}" r="${dotR}" fill="var(--accent-2)"/>`;
        s += `<circle cx="${r.x2.toFixed(1)}" cy="${r.y}" r="${dotR}" fill="var(--accent-2)"/>`;
        s += '</g>';
    }
    s += '</g>';

    // Tether lines: strand → primary drift dot
    s += '<g stroke="var(--accent-2)" stroke-width="0.9" stroke-linecap="round" stroke-dasharray="2 5" opacity="0.22">';
    for (const d of driftDots) {
        s += `<line x1="${d.fx.toFixed(1)}" y1="${d.fy.toFixed(1)}" x2="${d.cx.toFixed(1)}" y2="${d.cy.toFixed(1)}"/>`;
    }
    s += '</g>';

    // Tether lines: primary → secondary drift dot
    s += '<g stroke="var(--accent-2)" stroke-width="0.65" stroke-linecap="round" stroke-dasharray="1.5 6" opacity="0.13">';
    for (const d of driftDots2) {
        s += `<line x1="${d.fx.toFixed(1)}" y1="${d.fy.toFixed(1)}" x2="${d.cx.toFixed(1)}" y2="${d.cy.toFixed(1)}"/>`;
    }
    s += '</g>';

    // Primary drift dots
    s += `<g filter="url(#${glowMd})">`;
    for (const d of driftDots) {
        s += `<circle cx="${d.cx.toFixed(1)}" cy="${d.cy.toFixed(1)}" r="${d.r.toFixed(2)}" fill="var(--accent-2)" opacity="0.40"/>`;
    }
    s += '</g>';

    // Secondary drift dots
    s += `<g filter="url(#${glowLg})">`;
    for (const d of driftDots2) {
        s += `<circle cx="${d.cx.toFixed(1)}" cy="${d.cy.toFixed(1)}" r="${d.r.toFixed(2)}" fill="var(--accent-2)" opacity="0.35"/>`;
    }
    s += '</g>';

    return s;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BioBackground() {
    const strand1Ref = useRef<SVGPolylineElement>(null);
    const strand2Ref = useRef<SVGPolylineElement>(null);
    const tube1Ref   = useRef<SVGPolylineElement>(null);
    const tube2Ref   = useRef<SVGPolylineElement>(null);
    const dynamicRef = useRef<SVGGElement>(null);
    const rafRef     = useRef<number>(0);
    const startRef   = useRef<number | null>(null);
    const frameRef   = useRef<number>(0);

    const uid      = useId().replace(/:/g, '');
    const glowSm   = `g-sm-${uid}`;
    const glowMd   = `g-md-${uid}`;
    const glowLg   = `g-lg-${uid}`;
    const fadeGrad = `sfade-${uid}`;

    // Stable string refs so the rAF closure never captures stale filter IDs
    const glowSmRef = useRef(glowSm);
    const glowMdRef = useRef(glowMd);
    const glowLgRef = useRef(glowLg);

    useEffect(() => {
        function tick(ts: number) {
            if (startRef.current === null) startRef.current = ts;
            const phase = (2 * Math.PI * (ts - startRef.current)) / PHASE_PERIOD_MS;
            const [p1, p2] = buildBackbone(phase);

            strand1Ref.current?.setAttribute('points', p1);
            strand2Ref.current?.setAttribute('points', p2);
            tube1Ref.current?.setAttribute('points', p1);
            tube2Ref.current?.setAttribute('points', p2);

            // Update rungs/dots/tethers at ~30 fps (every 2nd frame)
            frameRef.current++;
            if (frameRef.current % 2 === 0 && dynamicRef.current) {
                dynamicRef.current.innerHTML = buildDynamicSVG(
                    phase,
                    glowSmRef.current,
                    glowMdRef.current,
                    glowLgRef.current,
                );
            }

            rafRef.current = requestAnimationFrame(tick);
        }

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    // Build initial backbone points for SSR/first paint
    let initP1 = '';
    let initP2 = '';
    for (let y = Y_START; y <= Y_END; y += 2) {
        const a = (2 * Math.PI * y) / PERIOD;
        const A = amplitudeAt(y);
        const s = Math.sin(a);
        initP1 += `${(HELIX_CX + A * s).toFixed(1)},${y} `;
        initP2 += `${(HELIX_CX - A * s).toFixed(1)},${y} `;
    }

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
                <filter id={glowSm} x="-80%"  y="-80%"  width="260%" height="260%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" in="SourceGraphic" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id={glowMd} x="-120%" y="-120%" width="340%" height="340%">
                    <feGaussianBlur stdDeviation="5"   result="blur" in="SourceGraphic" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id={glowLg} x="-180%" y="-180%" width="460%" height="460%">
                    <feGaussianBlur stdDeviation="9"   result="blur" in="SourceGraphic" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>

                <linearGradient id={fadeGrad} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                    <stop offset="0%"   stopColor="var(--accent)" stopOpacity="0"    />
                    <stop offset="20%"  stopColor="var(--accent)" stopOpacity="0.17" />
                    <stop offset="46%"  stopColor="var(--accent)" stopOpacity="0.26" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.21" />
                </linearGradient>
            </defs>

            <g transform={`rotate(-32 ${W / 2} ${H / 2})`} className="bio-helix-group">

                {/* Luminous glow tubes */}
                <polyline ref={tube1Ref} points={initP1} fill="none"
                    stroke="var(--accent)" strokeWidth="12" opacity="0.055"
                    filter={`url(#${glowSm})`} />
                <polyline ref={tube2Ref} points={initP2} fill="none"
                    stroke="var(--accent)" strokeWidth="12" opacity="0.055"
                    filter={`url(#${glowSm})`} />

                {/* Teal backbone strands */}
                <polyline ref={strand1Ref} points={initP1} fill="none"
                    stroke={`url(#${fadeGrad})`} strokeWidth="3" strokeLinecap="round" />
                <polyline ref={strand2Ref} points={initP2} fill="none"
                    stroke={`url(#${fadeGrad})`} strokeWidth="3" strokeLinecap="round" />

                {/* Rungs, dots, tethers and drift dots — all phase-animated */}
                <g ref={dynamicRef} />

                {/* Sparkle accents — position-stable, only opacity animates */}
                <g filter={`url(#${glowLg})`} className="bio-sparkles">
                    {SPARKLES.map((s, i) => (
                        <circle key={i} cx={s.cx} cy={s.cy} r={s.r}
                            fill="var(--accent-2)" opacity="0.55" />
                    ))}
                </g>

            </g>
        </svg>
    );
}
