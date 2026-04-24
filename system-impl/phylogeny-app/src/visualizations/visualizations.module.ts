import { Module } from '@nestjs/common';

import { VisualizationsService } from './visualizations.service';
import { VisualizationsController } from './visualizations.controller';

@Module({
    controllers: [VisualizationsController],
    providers: [VisualizationsService],
})
export class VisualizationsModule {}
