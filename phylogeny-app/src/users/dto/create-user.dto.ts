import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class CreateUserDto {
    @IsString({ message: 'First name must be a string' })
    @Length(1, 20)
    firstName!: string;

    @IsString({ message: 'Last name must be a string' })
    @Length(1, 20)
    lastName!: string;

    @IsEmail({}, { message: 'Email must be a valid email address' })
    @MaxLength(50, { message: 'Email must be at most 50 characters long' })
    email!: string;

    @IsString({ message: 'Password must be a string' })
    @Length(8, 100, { message: 'Password must be between 8 and 100 characters long' })
    password!: string;
}
