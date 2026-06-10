export class ResponseAnalyzeDto {
    matrixRequestId: number;
    visualizationId: string;
    status: string;

    constructor(matrixRequestId: number, visualizationId: string, status: string) {
        this.matrixRequestId = matrixRequestId;
        this.visualizationId = visualizationId;
        this.status = status;
    }
}
