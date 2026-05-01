import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesPermissionsModule } from './roles-permissions/roles-permissions.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from './users/entities/user.entity';
import { AuthController } from './auth.controller';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        UsersModule,
        RolesModule,
        PermissionsModule,
        RolesPermissionsModule,
        TypeOrmModule.forFeature([User]),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                //If the JWT_SECRET is not defined, throw an error to prevent the app to start without a secret key
                const secret = config.get<string>('JWT_SECRET');
                if (!secret) {
                    throw new Error('JWT_SECRET is not defined');
                }

                //The expiresIn is defined in the .env file, but if its not, the default is 1 hour
                const expiresIn = config.get<string>('JWT_EXPIRES_IN') || '1h';

                return {
                    secret,
                    signOptions: {
                        expiresIn: expiresIn as JwtSignOptions['expiresIn'],
                    },
                };
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}
