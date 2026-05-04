import { IsInt, IsOptional, IsPositive, IsString, Length, MaxLength, Min } from 'class-validator';

export class CreateMatrixDto {
    @IsString({ message: 'name must be a string' })
    @Length(1, 100, { message: 'name must be between 1 and 100 characters long' })
    name!: string;

    @IsOptional()
    @IsString({ message: 'description must be a string' })
    @MaxLength(255, { message: 'description must be at most 255 characters long' })
    description?: string;

    @IsString({ message: 'objectKey must be a string' })
    @Length(1, 2000, { message: 'objectKey must be between 1 and 2000 characters long' })
    objectKey!: string;

    @IsOptional()
    @IsInt({ message: 'fileSize must be an integer' })
    @Min(0, { message: 'fileSize must be a non-negative integer' })
    fileSize?: number;

    @IsInt({ message: 'userId must be an integer' })
    @IsPositive({ message: 'userId must be a positive integer' })
    userId!: number;
}
