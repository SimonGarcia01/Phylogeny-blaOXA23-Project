import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MatricesModule } from './matrices/matrices.module';
import { VisualizationsModule } from './visualizations/visualizations.module';
import { MatrixRequestsModule } from './matrix-requests/matrix-requests.module';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './common/utils/seed/seed.module';
import { MinioModule } from './common/utils/minio/minio.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { ApiModule } from './common/utils/api/api.module';

//Define the supported db types for the application
type SupportedDbTypes = 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mongodb' | 'oracle';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: configService.get<SupportedDbTypes>('DB_TYPE') ?? 'mysql',
                host: configService.get<string>('DB_HOST') ?? 'localhost',
                port: configService.get<number>('DB_PORT') ?? 5432,
                username: configService.get<string>('DB_USERNAME') ?? 'root',
                password: configService.get<string>('DB_PASSWORD') ?? 'root',
                database: configService.get<string>('DB_DATABASE') ?? 'test',
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: configService.get<boolean>('DB_SYNCHRONIZE') ?? false,
            }),
        }),
        MatricesModule,
        VisualizationsModule,
        MatrixRequestsModule,
        AuthModule,
        SeedModule,
        MinioModule,
        DashboardsModule,
        ApiModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
