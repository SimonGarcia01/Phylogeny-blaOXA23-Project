import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Role } from 'src/auth/roles/entities/role.entity';
import { Permission } from 'src/auth/permissions/entities/permission.entity';
import { RolesPermission } from 'src/auth/roles-permissions/entities/roles-permission.entity';
import { User } from 'src/auth/users/entities/user.entity';

import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Role, Permission, RolesPermission, User])],
    controllers: [SeedController],
    providers: [SeedService],
})
export class SeedModule {}
