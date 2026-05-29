import { ResponseUserDto } from '../users/dto/response-user.dto';

export class AuthResponseDto {
    accessToken: string;
    user: ResponseUserDto;

    constructor(accessToken: string, user: ResponseUserDto) {
        this.accessToken = accessToken;
        this.user = user;
    }
}
