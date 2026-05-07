import { IsString, Length } from 'class-validator';

export class GenerateUploadDto {
    @IsString({ message: 'fileName must be a string' })
    @Length(1, 100, { message: 'fileName must be between 1 and 100 characters long' })
    fileName!: string;
}
