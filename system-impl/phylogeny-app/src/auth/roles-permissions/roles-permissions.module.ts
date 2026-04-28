import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesModule } from 'src/auth/roles/roles.module';
import { PermissionsModule } from 'src/auth/permissions/permissions.module';

import { RolesPermissionsService } from './roles-permissions.service';
import { RolesPermissionsController } from './roles-permissions.controller';
import { RolesPermission } from './entities/roles-permission.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RolesPermission]), RolesModule, PermissionsModule],
    controllers: [RolesPermissionsController],
    providers: [RolesPermissionsService],
    exports: [RolesPermissionsService],
})
export class RolesPermissionsModule {}
