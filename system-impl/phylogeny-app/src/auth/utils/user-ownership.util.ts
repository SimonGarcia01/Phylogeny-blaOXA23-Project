import { ForbiddenException } from '@nestjs/common';

/**
 * Returns true if the requesting user owns the resource.
 * Pass the entity's owner ID and the requesting user's ID.
 */
export function isOwner(entityUserId: number, requestingUserId: number): boolean {
    return entityUserId === requestingUserId;
}

/**
 * Throws ForbiddenException if the requesting user does not own the resource.
 * Pass a human-readable resource label for the error message (e.g. 'matrix', 'visualization').
 */
export function assertOwnership(entityUserId: number, requestingUserId: number, resourceLabel = 'resource'): void {
    if (!isOwner(entityUserId, requestingUserId)) {
        throw new ForbiddenException(`You do not have access to this ${resourceLabel}.`);
    }
}
