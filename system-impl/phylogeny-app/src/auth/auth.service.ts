import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';

import { UsersService } from './users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { User } from './users/entities/user.entity';
import { SignUpUserDto } from './dto/singup-user.dto';
import { ResponseUserDto } from './users/dto/response-user.dto';
import { RolesService } from './roles/roles.service';
import { Role, RoleName } from './roles/entities/role.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private userService: UsersService,
        private jwtService: JwtService,
        private roleService: RolesService,
        private readonly configService: ConfigService,
    ) {}

    async validateUser(email: string, password: string): Promise<User> {
        const user: User | null = await this.userService.findByEmail(email);

        if (!user) throw new NotFoundException(`User with email ${email} not found.`);

        const matches = await bcrypt.compare(password, user.encryptedPassword);

        if (!matches) throw new UnauthorizedException('Invalid credentials');

        return user;
    }

    async login(userLoginDto: UserLoginDto): Promise<AuthResponseDto> {
        const user: User = await this.validateUser(userLoginDto.email, userLoginDto.password);

        const permissions = user.role.rolesPermissions.map((rp) => rp.permission.name);

        const payload = { sub: user.id, email: user.email, permissions };

        const accessToken = this.jwtService.sign(payload);
        const responseUser = new ResponseUserDto(user.email, user.firstName, user.lastName);

        return new AuthResponseDto(accessToken, responseUser);
    }

    async signup(signupDto: SignUpUserDto): Promise<AuthResponseDto> {
        const emailExists: User | null = await this.userService.findByEmail(signupDto.email);

        if (emailExists) throw new DbIntegrityException('A user with the provided email already exists.');

        const saltRounds: number = parseInt(this.configService.get<string>('SALT_ROUNDS') ?? '10');

        const encryptedPassword: string = await bcrypt.hash(signupDto.password, saltRounds);

        const role: Role = await this.roleService.findOneByName(RoleName.RESEARCHER);

        const newUser: User = this.userRepository.create({
            ...signupDto,
            role: role,
            encryptedPassword: encryptedPassword,
        });

        await this.userRepository.save(newUser);

        const savedUser: User = await this.userService.findOneUser(newUser.id);

        const permissions = savedUser.role.rolesPermissions.map((rp) => rp.permission.name);

        const payload = { sub: savedUser.id, email: savedUser.email, permissions };

        const accessToken = this.jwtService.sign(payload);
        const responseUser = new ResponseUserDto(savedUser.email, savedUser.firstName, savedUser.lastName);

        return new AuthResponseDto(accessToken, responseUser);
    }
}
