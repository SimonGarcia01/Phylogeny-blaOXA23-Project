import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { MinioModule } from 'src/utils/minio/minio.module';
import { MatricesModule } from 'src/matrices/matrices.module';
import { MatrixRequestsModule } from 'src/matrix-requests/matrix-requests.module';

import { VisualizationsService } from './visualizations.service';
import { VisualizationsController } from './visualizations.controller';
import { Visualization } from './entities/visualization.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Visualization]),
        MinioModule,
        forwardRef(() => MatricesModule),
        MatrixRequestsModule,
        HttpModule,
    ],
    controllers: [VisualizationsController],
    providers: [VisualizationsService],
    exports: [VisualizationsService],
})
export class VisualizationsModule {}
