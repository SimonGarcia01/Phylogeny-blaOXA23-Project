import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MatrixRequestsService } from './matrix-requests.service';
import { MatrixRequestsController } from './matrix-requests.controller';
import { MatrixRequest } from './entities/matrix-request.entity';

@Module({
    imports: [TypeOrmModule.forFeature([MatrixRequest])],
    controllers: [MatrixRequestsController],
    providers: [MatrixRequestsService],
    exports: [MatrixRequestsService],
})
export class MatrixRequestsModule {}
