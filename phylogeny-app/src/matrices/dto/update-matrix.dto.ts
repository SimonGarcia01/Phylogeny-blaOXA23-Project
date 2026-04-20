import { PartialType } from '@nestjs/mapped-types';

import { CreateMatrixDto } from './create-matrix.dto';

export class UpdateMatrixDto extends PartialType(CreateMatrixDto) {}
