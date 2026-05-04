import { Type } from 'class-transformer';
import { IsDateString, IsString, IsUUID, Length } from 'class-validator';

export class CreateMatrixRequestDto {
    @IsString({ message: 'name must be a string' })
    @Length(1, 30, { message: 'name must be between 1 and 30 characters long' })
    name!: string;

    @IsDateString({}, { message: 'requestedAt must be a valid ISO 8601 date string' })
    @Type(() => Date)
    requestedAt!: Date;

    @IsString({ message: 'matrixId must be a string' })
    @IsUUID('4', { message: 'matrixId must be a valid UUID v4 string' })
    matrixId!: string;
}
