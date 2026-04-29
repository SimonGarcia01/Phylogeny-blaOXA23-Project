import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    async login(@Body() userLoginDto: UserLoginDto) {
        return this.authService.login(userLoginDto);
    }
}
