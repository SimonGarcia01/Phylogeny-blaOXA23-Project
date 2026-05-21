export class ResponseVisualizationDetailDto {
    visualizationId: string;
    name?: string;
    description?: string;
    createdAt?: Date;
    fileSize?: number;
    relatedMatrixId?: string;

    constructor(
        visualizationId: string,
        name?: string,
        description?: string,
        createdAt?: Date,
        fileSize?: number,
        relatedMatrixId?: string,
    ) {
        this.visualizationId = visualizationId;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
        this.fileSize = fileSize;
        this.relatedMatrixId = relatedMatrixId;
    }
}
