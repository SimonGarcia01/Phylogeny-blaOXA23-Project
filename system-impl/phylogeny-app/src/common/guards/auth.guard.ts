import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

import { IS_INTERNAL_KEY } from '../decorators/internal.decorator';

//This is just to extend the default JwtAuthGuard
//This is to allow explicit public routes
//The rest of the routes will require authentication by default
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        //Check if the route is marked as public = skip authentication
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) return true;

        //Check if the route is marked as internal = skip JWT authentication
        const isInternal = this.reflector.getAllAndOverride<boolean>(IS_INTERNAL_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isInternal) return true;

        return super.canActivate(context);
    }
}
