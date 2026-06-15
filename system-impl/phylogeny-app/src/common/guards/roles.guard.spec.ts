import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { RoleName } from 'src/auth/roles/entities/role.entity';
import { User } from 'src/auth/users/entities/user.entity';

function buildUser(roleName: RoleName): User {
    return { id: 1, role: { name: roleName } } as unknown as User;
}

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: { getAllAndOverride: jest.Mock };

    beforeEach(() => {
        reflector = { getAllAndOverride: jest.fn() };
        guard = new RolesGuard(reflector as unknown as Reflector);
    });

    function setup(requiredRoles: RoleName[] | null, user: User | null) {
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        const request = { user };
        return {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({ getRequest: () => request }),
        } as unknown as ExecutionContext;
    }

    it('returns true when no roles are required', () => {
        const ctx = setup(null, null);
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when required roles array is empty', () => {
        const ctx = setup([], null);
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when user is absent and role is required', () => {
        const ctx = setup([RoleName.ADMIN], null);
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('returns true when user has the required role', () => {
        const ctx = setup([RoleName.ADMIN], buildUser(RoleName.ADMIN));
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when user does not have the required role', () => {
        const ctx = setup([RoleName.ADMIN], buildUser(RoleName.RESEARCHER));
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
});
