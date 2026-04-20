import { Injectable } from '@nestjs/common';

import { CreateVisualizationDto } from './dto/create-visualization.dto';
import { UpdateVisualizationDto } from './dto/update-visualization.dto';

@Injectable()
export class VisualizationsService {
    create(createVisualizationDto: CreateVisualizationDto) {
        return 'This action adds a new visualization';
    }

    findAll() {
        return `This action returns all visualizations`;
    }

    findOne(id: number) {
        return `This action returns a #${id} visualization`;
    }

    update(id: number, updateVisualizationDto: UpdateVisualizationDto) {
        return `This action updates a #${id} visualization`;
    }

    remove(id: number) {
        return `This action removes a #${id} visualization`;
    }
}
