import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesPermissionsModule } from './roles-permissions/roles-permissions.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        UsersModule,
        RolesModule,
        PermissionsModule,
        RolesPermissionsModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: (() => {
                    const secret = config.get<string>('JWT_SECRET');
                    if (!secret) {
                        throw new Error('JWT_SECRET is not defined in environment variables');
                    }
                    return secret;
                })(),
                signOptions: {
                    expiresIn: config.get<string | number>('JWT_EXPIRES_IN') || '1h',
                },
            }),
        }),
    ],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}
