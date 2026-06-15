import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './auth.guard';

const mockReflector = () => ({ getAllAndOverride: jest.fn() });

function mockContext(): ExecutionContext {
    return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn(),
    } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let reflector: ReturnType<typeof mockReflector>;

    beforeEach(() => {
        reflector = mockReflector();
        guard = new JwtAuthGuard(reflector as unknown as Reflector);
    });

    it('returns true immediately for @Public() routes', () => {
        reflector.getAllAndOverride
            .mockReturnValueOnce(true)   // isPublic
            .mockReturnValueOnce(false);  // isInternal
        const ctx = mockContext();
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true immediately for @Internal() routes', () => {
        reflector.getAllAndOverride
            .mockReturnValueOnce(false)  // isPublic
            .mockReturnValueOnce(true);  // isInternal
        const ctx = mockContext();
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('delegates to passport JWT for normal (authenticated) routes', () => {
        reflector.getAllAndOverride
            .mockReturnValueOnce(false)  // isPublic
            .mockReturnValueOnce(false); // isInternal
        const ctx = mockContext();
        const superActivateSpy = jest
            .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
            .mockReturnValue(true as any);
        guard.canActivate(ctx);
        expect(superActivateSpy).toHaveBeenCalledWith(ctx);
        superActivateSpy.mockRestore();
    });
});
