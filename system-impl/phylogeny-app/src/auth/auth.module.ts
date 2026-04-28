import { Module } from '@nestjs/common';

import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesPermissionsModule } from './roles-permissions/roles-permissions.module';

@Module({
    imports: [UsersModule, RolesModule, PermissionsModule, RolesPermissionsModule],
})
export class AuthModule {}
