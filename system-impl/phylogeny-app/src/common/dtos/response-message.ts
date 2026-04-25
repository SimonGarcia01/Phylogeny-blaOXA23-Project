export class ResponseMessage<T = unknown> {
    message!: string;
    data?: T;

    constructor(message: string) {
        this.message = message;
    }
}
