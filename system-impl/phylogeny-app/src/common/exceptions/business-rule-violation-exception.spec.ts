import { UnprocessableEntityException } from '@nestjs/common';
import { BusinessRuleViolationException } from './business-rule-violation-exception';

describe('BusinessRuleViolationException', () => {
    it('is an instance of UnprocessableEntityException', () => {
        const error = new BusinessRuleViolationException('test message');
        expect(error).toBeInstanceOf(UnprocessableEntityException);
    });

    it('carries the correct statusCode', () => {
        const error = new BusinessRuleViolationException('test message');
        expect(error.getStatus()).toBe(422);
    });

    it('carries the correct error label and message in the response body', () => {
        const error = new BusinessRuleViolationException('duplicate name');
        const body = error.getResponse() as Record<string, unknown>;
        expect(body.error).toBe('Business Rule Violation');
        expect(body.message).toBe('duplicate name');
        expect(body.statusCode).toBe(422);
    });
});
