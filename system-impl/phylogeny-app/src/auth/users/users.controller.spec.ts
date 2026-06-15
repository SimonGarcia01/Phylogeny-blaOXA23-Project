import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RoleName } from '../roles/entities/role.entity';

const mockUsersService = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOneDto: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
});

describe('UsersController', () => {
    let controller: UsersController;
    let service: ReturnType<typeof mockUsersService>;

    beforeEach(() => {
        service = mockUsersService();
        controller = new UsersController(service as unknown as UsersService);
    });

    it('create delegates to service', async () => {
        service.create.mockResolvedValue({ message: 'created' });
        const result = await controller.create({ email: 'u@t.com', password: 'pw', firstName: 'A', lastName: 'B', role: RoleName.RESEARCHER });
        expect(service.create).toHaveBeenCalled();
        expect(result.message).toBe('created');
    });

    it('findAll delegates to service', async () => {
        service.findAll.mockResolvedValue([]);
        expect(await controller.findAll()).toEqual([]);
    });

    it('findOne delegates to service with parsed id', async () => {
        service.findOneDto.mockResolvedValue({ id: 1, email: 'u@t.com' });
        const result = await controller.findOne(1);
        expect(service.findOneDto).toHaveBeenCalledWith(1);
        expect(result).toEqual({ id: 1, email: 'u@t.com' });
    });

    it('update delegates to service', async () => {
        service.update.mockResolvedValue({ message: 'updated' });
        const result = await controller.update(1, { firstName: 'X' });
        expect(service.update).toHaveBeenCalledWith(1, { firstName: 'X' });
        expect(result.message).toBe('updated');
    });

    it('remove delegates to service', async () => {
        service.remove.mockResolvedValue({ message: 'removed' });
        const result = await controller.remove(1);
        expect(service.remove).toHaveBeenCalledWith(1);
        expect(result.message).toBe('removed');
    });
});
