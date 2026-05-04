import Stream from 'stream';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

//Defining the minio service that will be used to interact with the minio server.
@Injectable()
export class MinioService implements OnModuleInit {
    // The MinIO client instance. It is initialized in onModuleInit().
    private client: Minio.Client | null = null;

    constructor(private readonly configService: ConfigService) {}

    //Initializes the MinIO client when the module starts
    onModuleInit() {
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

    //Function to upload a file to the minio server.
    //Takes in the file name and bucket name
    async uploadFile(bucket: string, fileName: string, buffer: Buffer): Promise<string> {
        const client = this.getClient();
        await client.putObject(bucket, fileName, buffer);
        return `${bucket}/${fileName}`;
    }

    //Function to download a file from the minIO server
    async getFile(bucket: string, fileName: string): Promise<Stream.Readable> {
        const client: Minio.Client = this.getClient();

        //Check if the bucker exists first
        const bucketExists: boolean = await client.bucketExists(bucket);

        if (!bucketExists) {
            throw new Error(`Bucket "${bucket}" does not exist.`);
        }

        //Check if the object exists in the bucket
        const objectExists: boolean = await client
            .statObject(bucket, fileName)
            .then(() => true)
            .catch(() => false);

        if (!objectExists) {
            throw new Error(`Object "${fileName}" does not exist in bucket "${bucket}".`);
        }

        //Get the object as a stream and collect it into a buffer
        const dataStream: Stream.Readable = await client.getObject(bucket, fileName);

        return dataStream;
    }
}
