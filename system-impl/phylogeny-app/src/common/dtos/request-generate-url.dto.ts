import { IsInt, IsString, Length, Min } from 'class-validator';

export class RequestGenerateUrlDto {
    @IsString({ message: 'fileName must be a string' })
    @Length(1, 100, { message: 'fileName must be between 1 and 100 characters long' })
    fileName!: string;

    @IsInt({ message: 'fileSize must be an integer' })
    @Min(1, { message: 'fileSize must be a positive integer' })
    fileSize!: number;

    @IsString({ message: 'fileType must be a string' })
    @Length(1, 20, { message: 'fileType must be between 1 and 20 characters long' })
    fileType!: string;
}
