export class ResponseGeneratedUrlDto {
    matrixId: string;
    objectKey: string;
    uploadUrl: string;

    constructor(matrixId: string, objectKey: string, uploadUrl: string) {
        this.matrixId = matrixId;
        this.objectKey = objectKey;
        this.uploadUrl = uploadUrl;
    }
}
