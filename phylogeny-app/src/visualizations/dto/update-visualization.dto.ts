import { PartialType } from '@nestjs/mapped-types';

import { CreateVisualizationDto } from './create-visualization.dto';

export class UpdateVisualizationDto extends PartialType(CreateVisualizationDto) {}
