import { IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class CreateVisualizationDto {
    @IsString({ message: 'name must be a string' })
    @Length(1, 100, { message: 'name must be between 1 and 100 characters long' })
    name!: string;

    @IsOptional()
    @IsString({ message: 'description must be a string' })
    @MaxLength(255, { message: 'description must be at most 255 characters long' })
    description?: string;

    @IsUUID('4', { message: 'Matrix ID must be a valid UUID v4' })
    matrixId!: string;
}
