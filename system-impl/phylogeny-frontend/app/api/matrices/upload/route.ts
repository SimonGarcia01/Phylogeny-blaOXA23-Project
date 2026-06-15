import { NextRequest, NextResponse } from 'next/server';

// This runs on the Next.js server (inside Docker), so it can reach minio:9000 directly.
const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

export async function POST(request: NextRequest): Promise<NextResponse> {
	const authorization = request.headers.get('Authorization');
	if (!authorization) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const name = formData.get('name') as string | null;
	const description = formData.get('description') as string | null;

	if (!file || !name) {
		return NextResponse.json({ message: 'File and name are required' }, { status: 400 });
	}

	const ext = file.name.includes('.') ? '.' + file.name.split('.').pop()!.toLowerCase() : '';

	// Step 1: Ask NestJS for a presigned PUT URL (uses internal URL)
	const urlRes = await fetch(`${INTERNAL_API_URL}/matrices/get-matrix-upload-url`, {
		method: 'POST',
		headers: { Authorization: authorization, 'Content-Type': 'application/json' },
		body: JSON.stringify({ fileName: file.name, fileSize: file.size, fileType: ext }),
	});
	if (!urlRes.ok) {
		const data = await urlRes.json().catch(() => ({ message: 'Failed to get upload URL' }));
		return NextResponse.json(data, { status: urlRes.status });
	}
	const { matrixId, objectKey, uploadUrl } = (await urlRes.json()) as {
		matrixId: string;
		objectKey: string;
		uploadUrl: string;
	};

	// Step 2: Upload directly to MinIO — server-side so minio:9000 resolves in Docker.
	// No Content-Type header: the presigned URL is signed for host only; extra headers break the signature.
	const uploadRes = await fetch(uploadUrl, {
		method: 'PUT',
		body: Buffer.from(await file.arrayBuffer()),
	});
	if (!uploadRes.ok) {
		return NextResponse.json(
			{ message: `Upload to storage failed: ${uploadRes.status} ${uploadRes.statusText}` },
			{ status: 502 },
		);
	}

	// Step 3: Create the matrix record in NestJS
	const createRes = await fetch(`${INTERNAL_API_URL}/matrices`, {
		method: 'POST',
		headers: { Authorization: authorization, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			matrixId,
			name,
			objectKey,
			description: description || undefined,
			mimeType: 'application/octet-stream',
			fileSize: file.size,
		}),
	});
	if (!createRes.ok) {
		const data = await createRes.json().catch(() => ({ message: 'Failed to create matrix record' }));
		return NextResponse.json(data, { status: createRes.status });
	}

	return NextResponse.json(await createRes.json());
}
