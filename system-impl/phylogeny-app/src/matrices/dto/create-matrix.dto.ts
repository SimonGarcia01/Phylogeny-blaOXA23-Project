import { IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

export class CreateMatrixDto {
    @IsString({ message: 'name must be a string' })
    @Length(1, 100, { message: 'name must be between 1 and 100 characters long' })
    name!: string;

    @IsOptional()
    @IsString({ message: 'description must be a string' })
    @MaxLength(255, { message: 'description must be at most 255 characters long' })
    description?: string;

    @IsOptional()
    @IsInt({ message: 'fileSize must be an integer' })
    @Min(0, { message: 'fileSize must be a non-negative integer' })
    fileSize?: number;
}
