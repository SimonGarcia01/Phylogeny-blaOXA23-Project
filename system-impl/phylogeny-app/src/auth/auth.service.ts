import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from './users/users.service';
import { UserLoginDto } from './dto/user-login.dto';
import { User } from './users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private jwtService: JwtService,
    ) {}

    async validateUser(email: string, password: string): Promise<User> {
        const user: User | null = await this.userService.findByEmail(email);

        if (!user) throw new NotFoundException(`User with email ${email} not found.`);

        const matches = await bcrypt.compare(password, user.encryptedPassword);

        if (!matches) throw new UnauthorizedException('Invalid credentials');

        return user;
    }

    async login(userLoginDto: UserLoginDto): Promise<{ accessToken: string }> {
        const user: User = await this.validateUser(userLoginDto.email, userLoginDto.password);

        const permissions = user.role.rolesPermissions.map((rp) => rp.permission.name);

        const payload = { sub: user.id, email: user.email, permissions };

        return { accessToken: this.jwtService.sign(payload) };
    }
}
