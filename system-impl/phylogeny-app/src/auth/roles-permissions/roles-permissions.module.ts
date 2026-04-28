import { Module } from '@nestjs/common';
import { RolesPermissionsService } from './roles-permissions.service';
import { RolesPermissionsController } from './roles-permissions.controller';

@Module({
  controllers: [RolesPermissionsController],
  providers: [RolesPermissionsService],
})
export class RolesPermissionsModule {}
