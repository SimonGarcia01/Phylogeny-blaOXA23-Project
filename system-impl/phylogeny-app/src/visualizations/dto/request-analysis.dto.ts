import { IsUUID } from 'class-validator';

export class AnalyzeMatrixDto {
    @IsUUID('4', { message: 'matrixId must be a valid UUID v4 string' })
    matrixId!: string;
}
