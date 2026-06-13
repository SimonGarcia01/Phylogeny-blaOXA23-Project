import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RoleName } from 'src/auth/roles/entities/role.entity';
import { User } from 'src/auth/users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
    user?: User;
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) return true;

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = request.user as User;

        if (!user) throw new ForbiddenException('User not authenticated, user missing in the request');

        if (!requiredRoles.includes(user.role.name)) {
            throw new ForbiddenException("The user doesn't have the required role to access this route");
        }

        return true;
    }
}
