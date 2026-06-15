import { RolesPermissionsController } from './roles-permissions.controller';
import { RolesPermissionsService } from './roles-permissions.service';

const mockService = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setPermissionsForRole: jest.fn(),
});

describe('RolesPermissionsController', () => {
    let controller: RolesPermissionsController;
    let service: ReturnType<typeof mockService>;

    beforeEach(() => {
        service = mockService();
        controller = new RolesPermissionsController(service as unknown as RolesPermissionsService);
    });

    it('create delegates to service', async () => {
        service.create.mockResolvedValue({ message: 'created' });
        const result = await controller.create({ roleId: 1, permissionId: 2 });
        expect(service.create).toHaveBeenCalledWith({ roleId: 1, permissionId: 2 });
        expect(result.message).toBe('created');
    });

    it('findAll delegates to service', async () => {
        service.findAll.mockResolvedValue([]);
        expect(await controller.findAll()).toEqual([]);
    });

    it('findOne delegates to service', async () => {
        service.findOne.mockResolvedValue({ roleId: 1, permissionId: 2 });
        const result = await controller.findOne(1);
        expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('update delegates to service', async () => {
        service.update.mockResolvedValue({ message: 'updated' });
        const result = await controller.update(1, { roleId: 2 });
        expect(service.update).toHaveBeenCalledWith(1, { roleId: 2 });
        expect(result.message).toBe('updated');
    });

    it('remove delegates to service', async () => {
        service.remove.mockResolvedValue({ message: 'deleted' });
        const result = await controller.remove(1);
        expect(service.remove).toHaveBeenCalledWith(1);
        expect(result.message).toBe('deleted');
    });

    it('setPermissionsForRole delegates to service', async () => {
        service.setPermissionsForRole.mockResolvedValue({ message: 'updated' });
        const result = await controller.setPermissionsForRole(1, { permissionIds: [1, 2, 3] });
        expect(service.setPermissionsForRole).toHaveBeenCalledWith(1, { permissionIds: [1, 2, 3] });
        expect(result.message).toBe('updated');
    });
});
