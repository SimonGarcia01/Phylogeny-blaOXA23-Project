import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../users/users.service';
import { JwtPayload } from '../dto/jwt-payload.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private config: ConfigService,
        private userService: UsersService,
    ) {
        const jwtSecret = config.get<string>('JWT_SECRET');
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
        });
    }
    //This method is called by the passport after it verifies the token's signature
    //The payload is the decoded JWT payload (with the ID, email and permissions)
    //If the user is found, it returns the user object, and it is attached to the request as request.user
    async validate(payload: JwtPayload): Promise<User> {
        const user = await this.userService.findOneUser(payload.sub);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }
}
