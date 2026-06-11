import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MinioModule } from 'src/common/utils/minio/minio.module';
import { MatricesModule } from 'src/matrices/matrices.module';
import { MatrixRequestsModule } from 'src/matrix-requests/matrix-requests.module';
import { ApiModule } from 'src/common/utils/api/api.module';

import { VisualizationsService } from './visualizations.service';
import { VisualizationsController } from './visualizations.controller';
import { Visualization } from './entities/visualization.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Visualization]),
        MinioModule,
        forwardRef(() => MatricesModule),
        MatrixRequestsModule,
        ApiModule,
    ],
    controllers: [VisualizationsController],
    providers: [VisualizationsService],
    exports: [VisualizationsService],
})
export class VisualizationsModule {}
