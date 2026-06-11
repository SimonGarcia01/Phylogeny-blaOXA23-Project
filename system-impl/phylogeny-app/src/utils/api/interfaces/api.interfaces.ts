export interface ApiResponse<T> {
    data: T;
    status: number;
    headers: Record<string, unknown>;
}

export interface ApiRequestOptions {
    headers?: Record<string, string>;
    timeout?: number;
}
