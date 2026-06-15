import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

const mockSeedService = () => ({
    seed: jest.fn(),
});

describe('SeedController', () => {
    let controller: SeedController;
    let service: ReturnType<typeof mockSeedService>;

    beforeEach(() => {
        service = mockSeedService();
        controller = new SeedController(service as unknown as SeedService);
    });

    it('run delegates to SeedService.seed and returns the result', async () => {
        service.seed.mockResolvedValue({ message: 'Database seeded successfully.' });
        const result = await controller.run();
        expect(service.seed).toHaveBeenCalled();
        expect(result.message).toContain('seeded');
    });

    it('run forwards early-exit message when already seeded', async () => {
        service.seed.mockResolvedValue({ message: 'Seed already applied (admin role exists).' });
        const result = await controller.run();
        expect(result.message).toContain('already applied');
    });
});
