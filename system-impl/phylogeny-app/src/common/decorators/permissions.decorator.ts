import { SetMetadata } from '@nestjs/common';

//This defines a custom decorator called "Permissions"
//Whatever list of permissions is passed to the decorator it will be stored as metadata
// The metadata will look like: { permissions: ['read', 'write'] }
//This will later be used by the PermissionsGuard to check if the user has the required permissions
export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
