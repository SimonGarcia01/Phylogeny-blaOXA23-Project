import { ConflictException } from '@nestjs/common';
import { DbIntegrityException } from './db-integrity-exception';

describe('DbIntegrityException', () => {
    it('is an instance of ConflictException', () => {
        const error = new DbIntegrityException('duplicate email');
        expect(error).toBeInstanceOf(ConflictException);
    });

    it('carries statusCode 409', () => {
        const error = new DbIntegrityException('duplicate email');
        expect(error.getStatus()).toBe(409);
    });

    it('carries the correct error label and message in the response body', () => {
        const error = new DbIntegrityException('duplicate email');
        const body = error.getResponse() as Record<string, unknown>;
        expect(body.error).toBe('Database Integrity Violation');
        expect(body.message).toBe('duplicate email');
        expect(body.statusCode).toBe(409);
    });
});
