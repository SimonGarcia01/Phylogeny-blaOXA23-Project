import { Matrix } from 'src/matrices/entities/matrix.entity';

export class CreateMatrixRequestDto {
    name: string;
    requestedAt: Date;
    matrix: Matrix;

    constructor(name: string, requestedAt: Date, matrix: Matrix) {
        this.name = name;
        this.requestedAt = requestedAt;
        this.matrix = matrix;
    }
}
