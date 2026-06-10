import { IsInt, IsPositive, IsString } from 'class-validator';

export class FinalizeVisualizationDto {
    @IsInt({ message: 'fileSize must be an integer' })
    @IsPositive({ message: 'fileSize must be a positive integer' })
    fileSize!: number;

    @IsString({ message: 'mimeType must be a string' })
    mimeType!: string;
}
