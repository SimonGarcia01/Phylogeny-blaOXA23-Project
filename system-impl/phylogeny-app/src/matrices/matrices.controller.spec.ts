import { MatricesController } from './matrices.controller';
import { MatricesService } from './matrices.service';
import { User } from 'src/auth/users/entities/user.entity';
import { RoleName } from 'src/auth/roles/entities/role.entity';

const mockMatricesService = () => ({
    generateUploadUrl: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
});

function buildUser(id = 1): User {
    return { id, email: 'u@test.com', role: { name: RoleName.RESEARCHER } } as unknown as User;
}

describe('MatricesController', () => {
    let controller: MatricesController;
    let service: ReturnType<typeof mockMatricesService>;

    beforeEach(() => {
        service = mockMatricesService();
        controller = new MatricesController(service as unknown as MatricesService);
    });

    it('generateUploadUrl delegates to service', async () => {
        service.generateUploadUrl.mockResolvedValue({ uploadUrl: 'url', objectKey: 'key', matrixId: 'id' });
        const result = await controller.generateUploadUrl(buildUser(), { fileName: 'a.nex', fileSize: 100, fileType: '.nex' });
        expect(service.generateUploadUrl).toHaveBeenCalled();
        expect(result.uploadUrl).toBe('url');
    });

    it('create delegates to service', async () => {
        service.create.mockResolvedValue({ message: 'created' });
        const result = await controller.create(buildUser(), { name: 'M', matrixId: 'id', objectKey: 'k', fileSize: 10 });
        expect(service.create).toHaveBeenCalled();
        expect(result.message).toBe('created');
    });

    it('findAll delegates to service', async () => {
        service.findAll.mockResolvedValue([]);
        const result = await controller.findAll(buildUser());
        expect(service.findAll).toHaveBeenCalledWith(buildUser());
        expect(result).toEqual([]);
    });

    it('findOne delegates to service with the parsed uuid', async () => {
        service.findOne.mockResolvedValue({ name: 'M' });
        const result = await controller.findOne('uuid-1', buildUser());
        expect(service.findOne).toHaveBeenCalledWith('uuid-1', buildUser());
        expect(result).toEqual({ name: 'M' });
    });

    it('update delegates to service', async () => {
        service.update.mockResolvedValue({ message: 'updated' });
        const result = await controller.update('uuid-1', { name: 'X' }, buildUser());
        expect(service.update).toHaveBeenCalledWith('uuid-1', { name: 'X' }, buildUser());
        expect(result.message).toBe('updated');
    });

    it('remove delegates to service', async () => {
        service.remove.mockResolvedValue({ message: 'removed' });
        const result = await controller.remove('uuid-1', buildUser());
        expect(service.remove).toHaveBeenCalledWith('uuid-1', buildUser());
        expect(result).toEqual({ message: 'removed' });
    });
});
