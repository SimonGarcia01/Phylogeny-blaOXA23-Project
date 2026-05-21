export class ResponseVisualizationListItemDto {
    visualizationId: string;
    name?: string;
    createdAt?: Date;

    constructor(visualizationId: string, name?: string, createdAt?: Date) {
        this.visualizationId = visualizationId;
        this.name = name;
        this.createdAt = createdAt;
    }
}
