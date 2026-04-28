import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateRoleDto {
    @IsString({ message: 'Name must be a string' })
    @Length(2, 50, { message: 'Name must be between 2 and 50 characters' })
    name!: string;

    @IsString({ message: 'Description must be a string' })
    @MaxLength(255, { message: 'Description must be at most 255 characters' })
    @IsOptional()
    description?: string;
}
