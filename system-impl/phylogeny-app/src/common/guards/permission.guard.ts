import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { User } from '../../auth/users/entities/user.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface AuthenticatedRequest extends Request {
    user?: User;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        //Get the information from the metadata set by the Permissions decorator
        //This is a list of permissions in string format
        //The getAllAndOverride method checks two things:
        // 1. if the handler (the controller method) has the metadata
        // 2. if not, it checks if the class (the controller) has the metadata
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        //If there are no permissions requiered, we allow access to the route
        if (!requiredPermissions || requiredPermissions.length === 0) return true;

        //Here we use a typed request to get the user object that was attached by the JwtStrategy
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = request.user as User;

        if (!user) throw new ForbiddenException('User not authenticated, user missing in the request');

        //Now we check if the user has the required permissions to access the route
        //Find the permissions of the user through the role and rolesPermissions
        const userPermissions = user.role.rolesPermissions.map((rp) => rp.permission.name);

        //Check if the user has all th required permissions
        //(.every loops through the required permissions and checks if they are included in the user's permissions)
        const hasEnoughPermissions = requiredPermissions.every((p: string) => userPermissions.includes(p));

        if (!hasEnoughPermissions)
            throw new ForbiddenException("The user doesn't have the required permissions to access this route");

        return true;
    }
}
