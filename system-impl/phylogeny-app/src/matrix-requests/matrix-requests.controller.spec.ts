import { MatrixRequestsController } from './matrix-requests.controller';
import { MatrixRequestsService } from './matrix-requests.service';
import { User } from 'src/auth/users/entities/user.entity';
import { RoleName } from 'src/auth/roles/entities/role.entity';
import { MatrixRequestStatus } from './entities/matrix-request.entity';

const mockService = () => ({
    findAll: jest.fn(),
    updateStatus: jest.fn(),
});

function buildUser(id = 1): User {
    return { id, email: 'u@test.com', role: { name: RoleName.RESEARCHER } } as unknown as User;
}

describe('MatrixRequestsController', () => {
    let controller: MatrixRequestsController;
    let service: ReturnType<typeof mockService>;

    beforeEach(() => {
        service = mockService();
        controller = new MatrixRequestsController(service as unknown as MatrixRequestsService);
    });

    it('findAll delegates to service with the current user', async () => {
        service.findAll.mockResolvedValue([]);
        const result = await controller.findAll(buildUser());
        expect(service.findAll).toHaveBeenCalledWith(buildUser());
        expect(result).toEqual([]);
    });

    it('updateStatus delegates to service with id and dto', async () => {
        service.updateStatus.mockResolvedValue({ message: 'updated' });
        const dto = { status: MatrixRequestStatus.COMPLETED };
        const result = await controller.updateStatus(1, dto);
        expect(service.updateStatus).toHaveBeenCalledWith(1, dto);
        expect(result.message).toBe('updated');
    });
});
