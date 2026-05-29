import { Body, Controller, Post } from '@nestjs/common';

import { Public } from 'src/common/decorators/public.decorator';

import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { CreateUserDto } from './users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @Post('login')
    async login(@Body() userLoginDto: UserLoginDto): Promise<AuthResponseDto> {
        return this.authService.login(userLoginDto);
    }

    @Public()
    @Post('signup')
    async signup(@Body() createUserDto: CreateUserDto): Promise<AuthResponseDto> {
        return this.authService.signup(createUserDto);
    }
}
