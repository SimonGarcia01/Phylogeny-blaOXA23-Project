jest.mock('./api-client.service', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
	},
}));

import apiClient from './api-client.service';
import matricesService from './matrices.service';

beforeEach(() => jest.clearAllMocks());

describe('matricesService.getAll', () => {
	it('GETs /matrices and returns the list', async () => {
		(apiClient.get as jest.Mock).mockResolvedValue([{ matrixId: 'uuid', name: 'M1' }]);
		const result = await matricesService.getAll();
		expect(apiClient.get).toHaveBeenCalledWith('/matrices');
		expect(result).toHaveLength(1);
	});
});

describe('matricesService.getOne', () => {
	it('GETs /matrices/:id', async () => {
		const detail = { matrixId: 'uuid', name: 'M1', description: '', fileSize: 100 };
		(apiClient.get as jest.Mock).mockResolvedValue(detail);
		const result = await matricesService.getOne('uuid');
		expect(apiClient.get).toHaveBeenCalledWith('/matrices/uuid');
		expect(result).toEqual(detail);
	});
});

describe('matricesService.generateUploadUrl', () => {
	it('POSTs to /matrices/get-matrix-upload-url', async () => {
		const res = { matrixId: 'uuid', objectKey: 'users/1/matrices/uuid', uploadUrl: 'https://url' };
		(apiClient.post as jest.Mock).mockResolvedValue(res);
		const result = await matricesService.generateUploadUrl({
			fileName: 'data.nex',
			fileSize: 1024,
			fileType: '.nex',
		});
		expect(apiClient.post).toHaveBeenCalledWith('/matrices/get-matrix-upload-url', {
			fileName: 'data.nex',
			fileSize: 1024,
			fileType: '.nex',
		});
		expect(result.uploadUrl).toBe('https://url');
	});
});

describe('matricesService.uploadToMinio', () => {
	it('PUTs the file to the presigned URL and resolves when ok', async () => {
		global.fetch = jest.fn().mockResolvedValue({ ok: true });
		const file = new File(['content'], 'data.nex');
		await expect(
			matricesService.uploadToMinio('https://minio:9000/presigned', file),
		).resolves.toBeUndefined();
		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('localhost:9000'),
			expect.objectContaining({ method: 'PUT', body: file }),
		);
	});

	it('replaces minio host with localhost:9000 in the URL', async () => {
		global.fetch = jest.fn().mockResolvedValue({ ok: true });
		const file = new File([], 'f.nex');
		await matricesService.uploadToMinio('http://minio:9000/bucket/key', file);
		expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('localhost:9000');
	});

	it('throws when the response is not ok', async () => {
		global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' });
		const file = new File([], 'f.nex');
		await expect(matricesService.uploadToMinio('http://minio:9000/key', file)).rejects.toThrow(
			'MinIO upload failed',
		);
	});
});

describe('matricesService.create', () => {
	it('POSTs to /matrices', async () => {
		(apiClient.post as jest.Mock).mockResolvedValue({ message: 'created successfully' });
		const dto = {
			matrixId: 'uuid',
			name: 'M',
			objectKey: 'users/1/matrices/uuid',
			mimeType: 'application/octet-stream' as const,
			fileSize: 100,
		};
		const result = await matricesService.create(dto);
		expect(apiClient.post).toHaveBeenCalledWith('/matrices', dto);
		expect(result.message).toContain('created');
	});
});

describe('matricesService.update', () => {
	it('PATCHes /matrices/:id', async () => {
		(apiClient.patch as jest.Mock).mockResolvedValue({ message: 'updated successfully' });
		const result = await matricesService.update('uuid', { name: 'New Name' });
		expect(apiClient.patch).toHaveBeenCalledWith('/matrices/uuid', { name: 'New Name' });
		expect(result.message).toContain('updated');
	});
});

describe('matricesService.remove', () => {
	it('DELETEs /matrices/:id', async () => {
		(apiClient.delete as jest.Mock).mockResolvedValue({ message: 'removed successfully' });
		const result = await matricesService.remove('uuid');
		expect(apiClient.delete).toHaveBeenCalledWith('/matrices/uuid');
		expect(result.message).toContain('removed');
	});
});
