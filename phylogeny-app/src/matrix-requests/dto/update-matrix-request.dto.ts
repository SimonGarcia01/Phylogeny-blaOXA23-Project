import { PartialType } from '@nestjs/mapped-types';

import { CreateMatrixRequestDto } from './create-matrix-request.dto';

export class UpdateMatrixRequestDto extends PartialType(CreateMatrixRequestDto) {}
