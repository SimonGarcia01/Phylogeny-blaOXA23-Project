import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

//This guard checks for a specific internal secret in the request headers
@Injectable()
export class InternalSecretGuard {
    canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest();

        //Extract the secret from the request headers
        const secret = request.headers['x-internal-secret'];

        //Check if the secret matches the expected value
        if (!secret || secret !== process.env.INTERNAL_SECRET) {
            throw new ForbiddenException('Invalid or missing internal secret');
        }
        return true;
    }
}
