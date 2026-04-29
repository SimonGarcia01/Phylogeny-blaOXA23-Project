import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { User } from '../../auth/users/entities/user.entity';

interface AuthenticatedRequest extends Request {
    user?: User;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // Obtenemos los permisos requeridos del decorador
        const required = this.reflector.get<string[]>('permissions', context.getHandler());
        if (!required || required.length === 0) return true; // Si no se requieren permisos, permitimos el acceso
        const req = context.switchToHttp().getRequest<AuthenticatedRequest>(); // Obtenemos el usuario autenticado del request (establecido por JwtStrategy)
        const user = req.user as User;
        if (!user) throw new ForbiddenException('No autenticado');

        const userPerms = user.role.rolesPermissions.map((rp) => rp.permission.name); // Obtenemos los permisos del usuario a través de su rol
        const hasEnoughPermissions = required.every((p: string) => userPerms.includes(p)); // Verificamos que el usuario tenga todos los permisos requeridos
        if (!hasEnoughPermissions) throw new ForbiddenException('Permisos insuficientes');
        return true;
    }
}
