export class ResponseMatrixListItemDto {
    matrixId: string;
    name?: string;
    uploadedAt?: Date;

    constructor(matrixId: string, name?: string, uploadedAt?: Date) {
        this.matrixId = matrixId;
        this.name = name;
        this.uploadedAt = uploadedAt;
    }
}
