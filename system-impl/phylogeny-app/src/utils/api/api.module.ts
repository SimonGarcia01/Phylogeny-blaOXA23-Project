import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { ApiService } from './services/api.service';
import { MicroserviceService } from './services/microservice.service';

@Module({
    imports: [
        HttpModule.register({
            timeout: 30000,
            maxRedirects: 5,
        }),
        ConfigModule,
    ],
    providers: [ApiService, MicroserviceService],
    exports: [ApiService, MicroserviceService],
})
export class ApiModule {}
