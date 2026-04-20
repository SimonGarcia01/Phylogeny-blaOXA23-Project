import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MatricesModule } from './matrices/matrices.module';
import { VisualizationsModule } from './visualizations/visualizations.module';
import { MatrixRequestsModule } from './matrix-requests/matrix-requests.module';

@Module({
    imports: [UsersModule, MatricesModule, VisualizationsModule, MatrixRequestsModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
