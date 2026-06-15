export class ResponseVisualizationListItemDto {
    visualizationId: string;
    name?: string;
    createdAt?: Date;
    fileSize?: number;

    constructor(visualizationId: string, name?: string, createdAt?: Date, fileSize?: number) {
        this.visualizationId = visualizationId;
        this.name = name;
        this.createdAt = createdAt;
        this.fileSize = fileSize;
    }
}
