import { Module } from '@nestjs/common';

import { MatricesService } from './matrices.service';
import { MatricesController } from './matrices.controller';

@Module({
    controllers: [MatricesController],
    providers: [MatricesService],
})
export class MatricesModule {}
