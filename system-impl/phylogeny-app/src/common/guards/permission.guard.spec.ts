import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permission.guard';
import { User } from 'src/auth/users/entities/user.entity';
import { RoleName } from 'src/auth/roles/entities/role.entity';

function buildUser(permissionNames: string[]): User {
    return {
        id: 1,
        role: {
            name: RoleName.RESEARCHER,
            rolesPermissions: permissionNames.map((name) => ({ permission: { name } })),
        },
    } as unknown as User;
}

function buildContext(user: User | null, requiredPerms: string[] | null, isInternal = false): ExecutionContext {
    const request = { user };
    return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({ getRequest: () => request }),
        // reflector reads are set up in test via mock
    } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
    let guard: PermissionsGuard;
    let reflector: { getAllAndOverride: jest.Mock };

    beforeEach(() => {
        reflector = { getAllAndOverride: jest.fn() };
        guard = new PermissionsGuard(reflector as unknown as Reflector);
    });

    function setup(isInternal: boolean, requiredPerms: string[] | null, user: User | null) {
        reflector.getAllAndOverride
            .mockReturnValueOnce(isInternal)     // IS_INTERNAL_KEY
            .mockReturnValueOnce(requiredPerms); // PERMISSIONS_KEY
        const request = { user };
        const ctx = {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({ getRequest: () => request }),
        } as unknown as ExecutionContext;
        return ctx;
    }

    it('returns true for @Internal() routes without checking permissions', () => {
        const ctx = setup(true, ['MATRICES_READ'], null);
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when no permissions are required', () => {
        const ctx = setup(false, null, null);
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when required permissions are empty', () => {
        const ctx = setup(false, [], null);
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when user is missing from request', () => {
        const ctx = setup(false, ['MATRICES_READ'], null);
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('returns true when user has all required permissions', () => {
        const user = buildUser(['MATRICES_READ', 'MATRICES_CREATE']);
        const ctx = setup(false, ['MATRICES_READ'], user);
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when user lacks a required permission', () => {
        const user = buildUser(['MATRICES_READ']);
        const ctx = setup(false, ['MATRICES_DELETE'], user);
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('requires ALL listed permissions — fails if only some match', () => {
        const user = buildUser(['MATRICES_READ']);
        const ctx = setup(false, ['MATRICES_READ', 'MATRICES_DELETE'], user);
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
});
