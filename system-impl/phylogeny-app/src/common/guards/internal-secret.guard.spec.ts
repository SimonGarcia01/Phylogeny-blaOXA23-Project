import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InternalSecretGuard } from './internal-secret.guard';

function buildContext(headerValue: string | undefined): ExecutionContext {
    const headers: Record<string, string | undefined> = { 'x-internal-secret': headerValue };
    const request = { headers };
    return {
        switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
}

describe('InternalSecretGuard', () => {
    const ORIGINAL_SECRET = process.env.INTERNAL_SECRET;
    let guard: InternalSecretGuard;

    beforeEach(() => {
        guard = new InternalSecretGuard();
        process.env.INTERNAL_SECRET = 'test-secret-123';
    });

    afterEach(() => {
        process.env.INTERNAL_SECRET = ORIGINAL_SECRET;
    });

    it('returns true when the correct secret is provided', () => {
        const ctx = buildContext('test-secret-123');
        expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when the secret is wrong', () => {
        const ctx = buildContext('wrong-secret');
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when the header is absent', () => {
        const ctx = buildContext(undefined);
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when the header is an empty string', () => {
        const ctx = buildContext('');
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
});
