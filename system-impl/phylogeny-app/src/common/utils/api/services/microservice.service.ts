import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AnalyzeRequestPayload } from '../interfaces/request-analyze.interface';
import { MicroserviceAnalysisResponse } from '../interfaces/response-analyze.interface';

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

    async triggerAnalysis(payload: AnalyzeRequestPayload): Promise<MicroserviceAnalysisResponse> {
        console.log('Triggering analysis with payload:', payload);
        const response = await this.apiService.post<AnalyzeRequestPayload, MicroserviceAnalysisResponse>(
            `${this.baseUrl}/analysis/analyze_matrix`,
            payload,
            { headers: this.internalHeaders },
        );

        console.log('Analysis response:', response.data);
        return response.data;
    }
}
