import { Injectable } from '@nestjs/common';

import { CreateMatrixRequestDto } from './dto/create-matrix-request.dto';
import { UpdateMatrixRequestDto } from './dto/update-matrix-request.dto';

@Injectable()
export class MatrixRequestsService {
    create(createMatrixRequestDto: CreateMatrixRequestDto) {
        return 'This action adds a new matrixRequest';
    }

    findAll() {
        return `This action returns all matrixRequests`;
    }

    findOne(id: number) {
        return `This action returns a #${id} matrixRequest`;
    }

    update(id: number, updateMatrixRequestDto: UpdateMatrixRequestDto) {
        return `This action updates a #${id} matrixRequest`;
    }

    remove(id: number) {
        return `This action removes a #${id} matrixRequest`;
    }
}
