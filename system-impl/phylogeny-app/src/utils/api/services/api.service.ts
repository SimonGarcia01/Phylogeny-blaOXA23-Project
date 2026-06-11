import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { ApiRequestOptions, ApiResponse } from '../interfaces/api.interfaces';

@Injectable()
export class ApiService {
    constructor(private readonly httpService: HttpService) {}

    async get<TResponse>(url: string, options?: ApiRequestOptions): Promise<ApiResponse<TResponse>> {
        const response = await firstValueFrom(this.httpService.get<TResponse>(url, options));

        return {
            data: response.data,
            status: response.status,
            headers: response.headers,
        };
    }

    async post<TBody, TResponse>(
        url: string,
        body: TBody,
        options?: ApiRequestOptions,
    ): Promise<ApiResponse<TResponse>> {
        const response = await firstValueFrom(this.httpService.post<TResponse>(url, body, options));

        return {
            data: response.data,
            status: response.status,
            headers: response.headers,
        };
    }

    async put<TBody, TResponse>(
        url: string,
        body: TBody,
        options?: ApiRequestOptions,
    ): Promise<ApiResponse<TResponse>> {
        const response = await firstValueFrom(this.httpService.put<TResponse>(url, body, options));

        return {
            data: response.data,
            status: response.status,
            headers: response.headers,
        };
    }

    async delete<TResponse>(url: string, options?: ApiRequestOptions): Promise<ApiResponse<TResponse>> {
        const response = await firstValueFrom(this.httpService.delete<TResponse>(url, options));

        return {
            data: response.data,
            status: response.status,
            headers: response.headers,
        };
    }
}
