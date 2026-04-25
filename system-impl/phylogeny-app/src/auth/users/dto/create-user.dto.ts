import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class CreateUserDto {
    @IsString({ message: 'firstName must be a string' })
    @Length(1, 20, { message: 'firstName must be between 1 and 20 characters long' })
    firstName!: string;

    @IsString({ message: 'lastName must be a string' })
    @Length(1, 20, { message: 'lastName must be between 1 and 20 characters long' })
    lastName!: string;

    @IsEmail({}, { message: 'email must be a valid email address' })
    @MaxLength(50, { message: 'email must be at most 50 characters long' })
    email!: string;

    @IsString({ message: 'password must be a string' })
    @Length(8, 30, { message: 'password must be between 8 and 30 characters long' })
    password!: string;
}
