import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class UserLoginDto {
    @IsEmail({}, { message: 'email must be a valid email address' })
    @MaxLength(50, { message: 'email must be at most 50 characters long' })
    email!: string;

    @IsString({ message: 'password must be a string' })
    @Length(8, 30, { message: 'password must be between 8 and 30 characters long' })
    password!: string;
}
