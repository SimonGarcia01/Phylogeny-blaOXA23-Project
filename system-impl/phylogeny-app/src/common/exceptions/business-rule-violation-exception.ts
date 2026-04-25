import { UnprocessableEntityException } from '@nestjs/common';

export class BusinessRuleViolationException extends UnprocessableEntityException {
    constructor(message: string) {
        super({
            statusCode: 422,
            error: 'Business Rule Violation',
            message,
        });
    }
}
