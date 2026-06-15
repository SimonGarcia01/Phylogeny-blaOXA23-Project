import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

//Defining the minio service that will be used to interact with the minio server.
@Injectable()
export class MinioService implements OnModuleInit {
    // The MinIO client instance. It is initialized in onModuleInit().
    private client: Minio.Client | null = null;

    //This are constants that define the bucket names so other places can use them without hardcoding everywhere.
    private readonly matrixBucket: string;
    private readonly visualizationBucket: string;

    constructor(private readonly configService: ConfigService) {
        this.matrixBucket = this.configService.getOrThrow<string>('MINIO_MATRIX_BUCKET');
        this.visualizationBucket = this.configService.getOrThrow<string>('MINIO_VISUALIZATION_BUCKET');
    }

    //Initializes the MinIO client when the module starts
    async onModuleInit() {
        const endPoint: string = this.configService.get<string>('MINIO_ENDPOINT') ?? 'localhost';
        const port: number = Number(this.configService.get<number>('MINIO_PORT') ?? 9000);
        const useSSL: boolean = (this.configService.get<string>('MINIO_USE_SSL') ?? 'false') === 'true';
        const accessKey: string = this.configService.get<string>('MINIO_ACCESS_KEY') ?? 'minio';
        const secretKey: string = this.configService.get<string>('MINIO_SECRET_KEY') ?? 'minio123';

        this.client = new Minio.Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });

        await this.ensureBucket(this.matrixBucket).catch((err) => {
            console.error(`Error ensuring matrix bucket "${this.matrixBucket}":`, err);
        });
        await this.ensureBucket(this.visualizationBucket).catch((err) => {
            console.error(`Error ensuring visualization bucket "${this.visualizationBucket}":`, err);
        });
    }

    //To give access to the client after it has been initialized
    private getClient(): Minio.Client {
        if (!this.client) {
            throw new Error('Minio client not initialized. Ensure MinioModule is loaded and onModuleInit ran.');
        }
        return this.client;
    }

    //Make sure a bucker exists, if it doesn't create it.
    async ensureBucket(bucket: string): Promise<void> {
        const client: Minio.Client = this.getClient();

        const bucketExists: boolean = await client.bucketExists(bucket);

        if (!bucketExists) {
            await client.makeBucket(bucket);
        }
    }

    //This will generate a presigned URL for uploading a file to the minIO server
    async generatePresignedPutUrl(bucket: string, objectKey: string): Promise<string> {
        const client = this.getClient();

        return await client.presignedPutObject(
            bucket,
            objectKey,
            60 * 60, // 1 hour expiration
        );
    }

    async generatePresignedGetUrl(bucket: string, objectKey: string): Promise<string> {
        const client: Minio.Client = this.getClient();
        return await client.presignedGetObject(bucket, objectKey, 60 * 60);
    }

    async deleteFile(bucket: string, objectKey: string): Promise<void> {
        const client: Minio.Client = this.getClient();

        const bucketExists: boolean = await client.bucketExists(bucket);
        if (!bucketExists) {
            throw new Error(`Bucket "${bucket}" does not exist.`);
        }

        await client.removeObject(bucket, objectKey);
    }

    get matrixBucketName(): string {
        return this.matrixBucket;
    }

    get visualizationBucketName(): string {
        return this.visualizationBucket;
    }
}
