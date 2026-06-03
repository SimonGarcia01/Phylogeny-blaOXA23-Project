export interface JwtPayload {
    sub: number;
    email: string;
    permissions: string[];
    issuedAt: number;
    expiration: number;
}
