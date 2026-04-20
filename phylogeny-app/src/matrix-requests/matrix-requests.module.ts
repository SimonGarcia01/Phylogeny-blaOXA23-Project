import { Module } from '@nestjs/common';

import { MatrixRequestsService } from './matrix-requests.service';
import { MatrixRequestsController } from './matrix-requests.controller';

@Module({
    controllers: [MatrixRequestsController],
    providers: [MatrixRequestsService],
})
export class MatrixRequestsModule {}
