import { ConflictException } from '@nestjs/common';

export class DbIntegrityException extends ConflictException {
    constructor(message: string) {
        super({
            statusCode: 409,
            error: 'Database Integrity Violation',
            message,
        });
    }
}
