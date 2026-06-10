import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { MatrixRequestStatus } from '../entities/matrix-request.entity';

export class UpdateMatrixRequestStatusDto {
    @IsEnum(MatrixRequestStatus)
    status!: MatrixRequestStatus;

    @IsOptional()
    @IsDateString()
    finishedAt?: Date;

    @IsOptional()
    @IsString()
    error?: string;
}
