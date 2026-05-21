import { Equals, IsInt, IsOptional, IsPositive, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class CreateVisualizationDto {
    @IsUUID('4', { message: 'visualizationId must be a valid UUID v4' })
    visualizationId!: string;

    @IsString({ message: 'name must be a string' })
    @Length(1, 100, { message: 'name must be between 1 and 100 characters long' })
    name!: string;

    @IsOptional()
    @IsString({ message: 'description must be a string' })
    @MaxLength(1000, { message: 'description must be at most 1000 characters long' })
    description?: string;

    @IsString({ message: 'objectKey must be a string' })
    @Length(59, 100, { message: 'objectKey must be between 59 and 100 characters long' })
    objectKey!: string;

    @IsString({ message: 'mimeType must be a string' })
    @Equals('application/octet-stream', { message: 'Only application/octet-stream mime type is allowed' })
    mimeType!: string;

    @IsInt({ message: 'fileSize must be an integer' })
    @IsPositive({ message: 'fileSize must be a positive integer' })
    fileSize!: number;

    @IsUUID('4', { message: 'matrixId must be a valid UUID v4' })
    matrixId!: string;
}
