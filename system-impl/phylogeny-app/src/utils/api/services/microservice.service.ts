import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AnalyzeRequestPayload } from '../interfaces/analyze-request.interface';

import { ApiService } from './api.service';

@Injectable()
export class MicroserviceService {
    private readonly baseUrl: string;
    private readonly internalSecret: string;

    constructor(
        private readonly apiService: ApiService,
        private readonly configService: ConfigService,
    ) {
        this.baseUrl = this.configService.getOrThrow<string>('MICROSERVICE_URL');
        this.internalSecret = this.configService.getOrThrow<string>('INTERNAL_SECRET');
    }

    private get internalHeaders(): Record<string, string> {
        return { 'x-internal-secret': this.internalSecret };
    }

    async triggerAnalysis(payload: AnalyzeRequestPayload): Promise<void> {
        await this.apiService.post<AnalyzeRequestPayload, void>(`${this.baseUrl}/analyze`, payload, {
            headers: this.internalHeaders,
        });
    }
}
