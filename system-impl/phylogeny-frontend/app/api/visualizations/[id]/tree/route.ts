import { NextRequest, NextResponse } from 'next/server';

// Runs on the Next.js server (inside Docker) — can reach minio:9000 directly.
const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	const { id } = await params;

	const authorization = request.headers.get('Authorization');
	if (!authorization) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	// Ask NestJS for a short-lived presigned GET URL — auth + ownership check happens there
	const urlRes = await fetch(`${INTERNAL_API_URL}/visualizations/${id}/tree-url`, {
		headers: { Authorization: authorization },
	});
	if (!urlRes.ok) {
		const data = await urlRes.json().catch(() => ({ message: 'Failed to get tree URL' }));
		return NextResponse.json(data, { status: urlRes.status });
	}
	const { url } = (await urlRes.json()) as { url: string };

	// Fetch the tree file from MinIO — server-side so minio:9000 resolves inside Docker
	const minioRes = await fetch(url);
	if (!minioRes.ok) {
		return NextResponse.json({ message: 'Failed to fetch tree from storage' }, { status: 502 });
	}

	const content = await minioRes.text();
	return new NextResponse(content, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
