import { Controller } from '@nestjs/common';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    async login(@Body() body: UserLoginDto) {
        return this.authService.login(body);
    }
}
