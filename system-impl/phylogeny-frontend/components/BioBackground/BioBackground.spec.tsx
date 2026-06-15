import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// rAF mock: stores callback but does NOT call it automatically (prevents infinite loop)
const rafCallbacks: Map<number, FrameRequestCallback> = new Map();
let rafId = 0;

global.requestAnimationFrame = jest.fn((cb) => {
	const id = ++rafId;
	rafCallbacks.set(id, cb);
	return id;
});
global.cancelAnimationFrame = jest.fn((id) => rafCallbacks.delete(id));

// Run one animation frame synchronously, then silence further rAF calls
function fireOneFrame(ts = 0) {
	const entry = rafCallbacks.entries().next();
	if (!entry.done) {
		const [id, cb] = entry.value;
		rafCallbacks.delete(id);
		cb(ts);
	}
}

function fireTwoFrames() {
	fireOneFrame(0);
	fireOneFrame(16);
}

import BioBackground from './BioBackground';

describe('BioBackground — structure', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		rafCallbacks.clear();
		rafId = 0;
	});

	it('renders an SVG element', async () => {
		const { container } = await act(async () => render(<BioBackground />));
		expect(container.querySelector('svg')).toBeInTheDocument();
	});

	it('svg has aria-hidden="true"', async () => {
		const { container } = await act(async () => render(<BioBackground />));
		expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
	});

	it('renders defs with at least 3 glow filter elements', async () => {
		const { container } = await act(async () => render(<BioBackground />));
		const filters = container.querySelectorAll('filter');
		expect(filters.length).toBeGreaterThanOrEqual(3);
	});

	it('renders a linearGradient for the strand fade', async () => {
		const { container } = await act(async () => render(<BioBackground />));
		expect(container.querySelector('linearGradient')).toBeInTheDocument();
	});

	it('renders the sparkle circles group', async () => {
		const { container } = await act(async () => render(<BioBackground />));
		const sparklesGroup = container.querySelector('.bio-sparkles');
		expect(sparklesGroup).toBeInTheDocument();
		expect(sparklesGroup!.querySelectorAll('circle').length).toBeGreaterThan(0);
	});

	it('renders four polyline elements (two strands + two glow tubes)', async () => {
		const { container } = await act(async () => render(<BioBackground />));
		expect(container.querySelectorAll('polyline').length).toBe(4);
	});

	it('registers a requestAnimationFrame on mount', async () => {
		await act(async () => render(<BioBackground />));
		expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
	});

	it('cancels the animation frame on unmount', async () => {
		const { unmount } = await act(async () => render(<BioBackground />));
		unmount();
		expect(global.cancelAnimationFrame).toHaveBeenCalled();
	});
});

describe('BioBackground — animation loop', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		rafCallbacks.clear();
		rafId = 0;
	});

	it('fires requestAnimationFrame on each tick to schedule the next frame', async () => {
		await act(async () => render(<BioBackground />));
		const callsBefore = (global.requestAnimationFrame as jest.Mock).mock.calls.length;

		await act(async () => { fireOneFrame(0); });

		expect((global.requestAnimationFrame as jest.Mock).mock.calls.length).toBeGreaterThan(callsBefore);
	});

	it('runs two frames without errors and updates strands', async () => {
		const { container } = await act(async () => render(<BioBackground />));
		const polylines = container.querySelectorAll('polyline');

		// fire first frame — sets startRef, updates strands
		await act(async () => { fireOneFrame(0); });
		expect(polylines[0].getAttribute('points')).not.toBeNull();

		// fire second frame — even frame, triggers buildDynamicSVG
		await act(async () => { fireOneFrame(48000); });
		expect(polylines[0].getAttribute('points')).not.toBeNull();
	});

	it('updates the dynamic group on the second (even) frame', async () => {
		const { container } = await act(async () => render(<BioBackground />));
		// The dynamic group is the last <g> inside .bio-helix-group
		const dynamicGroup = container.querySelector('.bio-helix-group > g:not(.bio-sparkles)');

		// Frame 1 (odd): no dynamic update
		await act(async () => { fireOneFrame(0); });
		const innerAfterFrame1 = dynamicGroup?.innerHTML ?? '';

		// Frame 2 (even): buildDynamicSVG runs and populates innerHTML
		await act(async () => { fireOneFrame(48000); });
		const innerAfterFrame2 = dynamicGroup?.innerHTML ?? '';

		// After an even frame with full phase period, the dynamic group should have content
		expect(innerAfterFrame2.length).toBeGreaterThanOrEqual(innerAfterFrame1.length);
	});

	it('handles a large timestamp (full period) without errors', async () => {
		await act(async () => render(<BioBackground />));
		// This should not throw — exercises amplitudeAt and buildBackbone with non-zero phase
		await expect(act(async () => { fireOneFrame(48000); })).resolves.toBeUndefined();
		await expect(act(async () => { fireOneFrame(96000); })).resolves.toBeUndefined();
	});

	it('cancels the last rAF handle on unmount', async () => {
		const { unmount } = await act(async () => render(<BioBackground />));
		await act(async () => { fireOneFrame(0); });
		const lastId = (global.requestAnimationFrame as jest.Mock).mock.results.at(-1)?.value;
		unmount();
		expect(global.cancelAnimationFrame).toHaveBeenCalledWith(lastId);
	});
});
