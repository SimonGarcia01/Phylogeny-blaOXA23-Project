import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

// Lightweight smoke test — does not boot the full AppModule (which needs a live DB).
// Individual feature modules are covered by their dedicated e2e specs.

@Controller()
class PingController {
    @Get('health')
    health() {
        return { status: 'ok' };
    }
}

describe('App smoke test (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PingController],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('serves a health endpoint without errors', () => {
        return request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
    });
});
