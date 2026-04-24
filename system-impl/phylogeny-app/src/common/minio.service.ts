import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
    private client: Minio.Client;

    onModuleInit() {
        this.client = new Minio.Client({
            endPoint: 'localhost',
            port: 9000,
            useSSL: false,
            accessKey: 'minio',
            secretKey: 'minio123',
        });
    }

    async uploadFile(bucket: string, fileName: string, buffer: Buffer) {
        await this.client.putObject(bucket, fileName, buffer);
        return `${bucket}/${fileName}`;
    }
}
