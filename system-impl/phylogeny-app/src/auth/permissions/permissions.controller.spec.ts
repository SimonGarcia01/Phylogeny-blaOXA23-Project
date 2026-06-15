import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

const mockPermissionsService = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
});

describe('PermissionsController', () => {
    let controller: PermissionsController;
    let service: ReturnType<typeof mockPermissionsService>;

    beforeEach(() => {
        service = mockPermissionsService();
        controller = new PermissionsController(service as unknown as PermissionsService);
    });

    it('create delegates to service', async () => {
        service.create.mockResolvedValue({ message: 'created' });
        const result = await controller.create({ name: 'MATRICES_READ' });
        expect(service.create).toHaveBeenCalledWith({ name: 'MATRICES_READ' });
        expect(result.message).toBe('created');
    });

    it('findAll delegates to service', async () => {
        service.findAll.mockResolvedValue([]);
        expect(await controller.findAll()).toEqual([]);
    });

    it('findOne delegates to service', async () => {
        service.findOne.mockResolvedValue({ id: 1, name: 'MATRICES_READ' });
        const result = await controller.findOne(1);
        expect(service.findOne).toHaveBeenCalledWith(1);
        expect(result).toEqual({ id: 1, name: 'MATRICES_READ' });
    });

    it('update delegates to service', async () => {
        service.update.mockResolvedValue({ message: 'updated' });
        const result = await controller.update(1, { name: 'MATRICES_WRITE' });
        expect(service.update).toHaveBeenCalledWith(1, { name: 'MATRICES_WRITE' });
        expect(result.message).toBe('updated');
    });

    it('remove delegates to service', async () => {
        service.remove.mockResolvedValue({ message: 'deleted' });
        const result = await controller.remove(1);
        expect(service.remove).toHaveBeenCalledWith(1);
        expect(result.message).toBe('deleted');
    });
});
