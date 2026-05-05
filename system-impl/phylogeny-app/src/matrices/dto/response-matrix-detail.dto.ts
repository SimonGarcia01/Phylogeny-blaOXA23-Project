export class ResponseMatrixDetailDto {
    matrixId!: string;
    name?: string;
    description?: string;
    uploadedAt?: Date;
    fileSize?: number;
    relatedVisualizationId?: string;

    constructor(
        matrixId: string,
        name?: string,
        description?: string,
        uploadedAt?: Date,
        fileSize?: number,
        relatedVisualizationId?: string,
    ) {
        this.matrixId = matrixId;
        this.name = name;
        this.description = description;
        this.uploadedAt = uploadedAt;
        this.fileSize = fileSize;
        this.relatedVisualizationId = relatedVisualizationId;
    }
}
