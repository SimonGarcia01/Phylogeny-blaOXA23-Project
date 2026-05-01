import { Controller, Get } from '@nestjs/common';

import { Public } from 'src/common/decorators/public.decorator';

import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
    constructor(private readonly seedService: SeedService) {}

    @Public()
    @Get('run')
    async run() {
        return await this.seedService.seed();
    }
}
