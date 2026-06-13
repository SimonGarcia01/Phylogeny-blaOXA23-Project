import { SetMetadata } from '@nestjs/common';

import { RoleName } from 'src/auth/roles/entities/role.entity';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
