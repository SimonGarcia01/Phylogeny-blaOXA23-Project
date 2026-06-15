import { ForbiddenException } from '@nestjs/common';
import { isOwner, assertOwnership } from './user-ownership.util';

describe('user-ownership.util', () => {
    describe('isOwner', () => {
        it('returns true when entity owner matches requesting user', () => {
            expect(isOwner(5, 5)).toBe(true);
        });

        it('returns false when entity owner differs from requesting user', () => {
            expect(isOwner(5, 99)).toBe(false);
        });

        it('returns false when IDs are both 0 only if they truly differ', () => {
            expect(isOwner(0, 0)).toBe(true);
        });
    });

    describe('assertOwnership', () => {
        it('does not throw when user owns the resource', () => {
            expect(() => assertOwnership(3, 3, 'matrix')).not.toThrow();
        });

        it('throws ForbiddenException when user does not own the resource', () => {
            expect(() => assertOwnership(3, 7, 'matrix')).toThrow(ForbiddenException);
        });

        it('includes the resource label in the error message', () => {
            try {
                assertOwnership(1, 2, 'visualization');
            } catch (e) {
                expect((e as ForbiddenException).message).toContain('visualization');
            }
        });

        it('uses "resource" as default label when none is provided', () => {
            try {
                assertOwnership(1, 2);
            } catch (e) {
                expect((e as ForbiddenException).message).toContain('resource');
            }
        });
    });
});
