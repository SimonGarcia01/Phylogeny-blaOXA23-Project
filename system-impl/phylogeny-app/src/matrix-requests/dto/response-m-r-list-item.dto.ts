export class MatrixRequestListItemDto {
    id: number;
    name: string;
    requestedAt: Date;
    finishedAt?: Date;
    status: string;

    constructor(id: number, name: string, requestedAt: Date, status: string, finishedAt?: Date) {
        this.id = id;
        this.name = name;
        this.requestedAt = requestedAt;
        this.status = status;
        this.finishedAt = finishedAt;
    }
}
