import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RoleName } from './entities/role.entity';

const mockRolesService = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
});

describe('RolesController', () => {
    let controller: RolesController;
    let service: ReturnType<typeof mockRolesService>;

    beforeEach(() => {
        service = mockRolesService();
        controller = new RolesController(service as unknown as RolesService);
    });

    it('create delegates to service', async () => {
        service.create.mockResolvedValue({ message: 'created' });
        const result = await controller.create({ name: RoleName.RESEARCHER });
        expect(service.create).toHaveBeenCalledWith({ name: RoleName.RESEARCHER });
        expect(result.message).toBe('created');
    });

    it('findAll delegates to service', async () => {
        service.findAll.mockResolvedValue([]);
        expect(await controller.findAll()).toEqual([]);
    });

    it('findOne delegates to service', async () => {
        service.findOne.mockResolvedValue({ id: 1, name: RoleName.RESEARCHER });
        const result = await controller.findOne(1);
        expect(service.findOne).toHaveBeenCalledWith(1);
        expect(result).toEqual({ id: 1, name: RoleName.RESEARCHER });
    });

    it('update delegates to service', async () => {
        service.update.mockResolvedValue({ message: 'updated' });
        const result = await controller.update(1, { description: 'desc' });
        expect(service.update).toHaveBeenCalledWith(1, { description: 'desc' });
        expect(result.message).toBe('updated');
    });

    it('remove delegates to service', async () => {
        service.remove.mockResolvedValue({ message: 'deleted' });
        const result = await controller.remove(1);
        expect(service.remove).toHaveBeenCalledWith(1);
        expect(result.message).toBe('deleted');
    });
});
