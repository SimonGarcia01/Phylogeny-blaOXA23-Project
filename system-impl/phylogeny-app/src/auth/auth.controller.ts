import { Body, Controller, Post } from '@nestjs/common';

import { Public } from 'src/common/decorators/public.decorator';

import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { CreateUserDto } from './users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @Post('login')
    async login(@Body() userLoginDto: UserLoginDto) {
        return this.authService.login(userLoginDto);
    }

    @Public()
    @Post('signup')
    async signup(@Body() createUserDto: CreateUserDto) {
        return this.authService.signup(createUserDto);
    }
}
