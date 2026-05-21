import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MinioModule } from 'src/utils/minio/minio.module';
import { MatricesModule } from 'src/matrices/matrices.module';

import { VisualizationsService } from './visualizations.service';
import { VisualizationsController } from './visualizations.controller';
import { Visualization } from './entities/visualization.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Visualization]), MinioModule, MatricesModule],
    controllers: [VisualizationsController],
    providers: [VisualizationsService],
    exports: [VisualizationsService],
})
export class VisualizationsModule {}
