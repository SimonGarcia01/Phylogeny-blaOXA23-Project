import { Matrix } from 'src/matrices/entities/matrix.entity';

export class CreateMatrixRequestDto {
    name: string;
    matrix: Matrix;

    constructor(name: string, matrix: Matrix) {
        this.name = name;
        this.matrix = matrix;
    }
}
