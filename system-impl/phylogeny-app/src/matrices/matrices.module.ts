import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MinioModule } from 'src/utils/minio/minio.module';
import { UsersModule } from 'src/auth/users/users.module';

import { MatricesService } from './matrices.service';
import { MatricesController } from './matrices.controller';
import { Matrix } from './entities/matrix.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Matrix]), MinioModule, UsersModule],
    controllers: [MatricesController],
    providers: [MatricesService],
    exports: [MatricesService],
})
export class MatricesModule {}
