import { ResponseUserDto } from '../users/dto/response-user.dto';

export class AuthResponseDto {
    token: string;
    user: ResponseUserDto;

    constructor(token: string, user: ResponseUserDto) {
        this.token = token;
        this.user = user;
    }
}
