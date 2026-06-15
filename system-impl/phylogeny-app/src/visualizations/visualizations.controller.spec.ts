import { VisualizationsController } from './visualizations.controller';
import { VisualizationsService } from './visualizations.service';
import { User } from 'src/auth/users/entities/user.entity';
import { RoleName } from 'src/auth/roles/entities/role.entity';
import { MatrixRequestStatus } from 'src/matrix-requests/entities/matrix-request.entity';

const mockVisualizationsService = () => ({
    analyze: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getTreeUrl: jest.fn(),
    finalize: jest.fn(),
});

function buildUser(id = 1): User {
    return { id, email: 'u@test.com', role: { name: RoleName.RESEARCHER } } as unknown as User;
}

describe('VisualizationsController', () => {
    let controller: VisualizationsController;
    let service: ReturnType<typeof mockVisualizationsService>;

    beforeEach(() => {
        service = mockVisualizationsService();
        controller = new VisualizationsController(service as unknown as VisualizationsService);
    });

    it('analyze delegates to service with matrixId', async () => {
        service.analyze.mockResolvedValue({ matrixRequestId: 1, visualizationId: 'v', status: MatrixRequestStatus.PENDING });
        const result = await controller.analyze(buildUser(), { matrixId: 'matrix-uuid' });
        expect(service.analyze).toHaveBeenCalledWith(buildUser(), 'matrix-uuid');
        expect(result.status).toBe(MatrixRequestStatus.PENDING);
    });

    it('findAll delegates to service', async () => {
        service.findAll.mockResolvedValue([]);
        const result = await controller.findAll(buildUser());
        expect(service.findAll).toHaveBeenCalledWith(buildUser());
        expect(result).toEqual([]);
    });

    it('findOne delegates to service with uuid', async () => {
        service.findOne.mockResolvedValue({ name: 'V' });
        const result = await controller.findOne('viz-uuid', buildUser());
        expect(service.findOne).toHaveBeenCalledWith('viz-uuid', buildUser());
        expect(result).toEqual({ name: 'V' });
    });

    it('update delegates to service', async () => {
        service.update.mockResolvedValue({ message: 'updated' });
        const result = await controller.update('viz-uuid', { name: 'X' }, buildUser());
        expect(service.update).toHaveBeenCalledWith('viz-uuid', { name: 'X' }, buildUser());
        expect(result.message).toBe('updated');
    });

    it('remove delegates to service', async () => {
        service.remove.mockResolvedValue({ message: 'removed' });
        const result = await controller.remove('viz-uuid', buildUser());
        expect(service.remove).toHaveBeenCalledWith('viz-uuid', buildUser());
        expect(result.message).toBe('removed');
    });

    it('getTreeUrl delegates to service', async () => {
        service.getTreeUrl.mockResolvedValue({ url: 'https://url' });
        const result = await controller.getTreeUrl('viz-uuid', buildUser());
        expect(service.getTreeUrl).toHaveBeenCalledWith('viz-uuid', buildUser());
        expect(result.url).toBe('https://url');
    });

    it('finalize delegates to service', async () => {
        service.finalize.mockResolvedValue({ message: 'finalized' });
        const result = await controller.finalize('viz-uuid', { fileSize: 1000, mimeType: 'text/plain' });
        expect(service.finalize).toHaveBeenCalledWith('viz-uuid', { fileSize: 1000, mimeType: 'text/plain' });
        expect(result.message).toBe('finalized');
    });
});
