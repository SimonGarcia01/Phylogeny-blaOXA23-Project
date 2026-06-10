import { SetMetadata } from '@nestjs/common';

//This decorator is used to mark routes as internal,
// So then the JWT guard and Permissions guard can skip authentication for those routes
// And instead let the InternalSecretGuard handle authentication
export const IS_INTERNAL_KEY = 'isInternal';

export const Internal = () => SetMetadata(IS_INTERNAL_KEY, true);
