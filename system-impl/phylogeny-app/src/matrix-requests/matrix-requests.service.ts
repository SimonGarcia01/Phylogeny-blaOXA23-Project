import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';

import { ResponseMessage } from 'src/common/dtos/response-message';
import { User } from 'src/auth/users/entities/user.entity';

import { MatrixRequest, MatrixRequestStatus } from './entities/matrix-request.entity';
import { CreateMatrixRequestDto } from './dto/create-matrix-request.dto';
import { UpdateMatrixRequestStatusDto } from './dto/status-update.dto';
import { MatrixRequestListItemDto } from './dto/response-m-r-list-item.dto';

@Injectable()
export class MatrixRequestsService {
    constructor(@InjectRepository(MatrixRequest) private matrixRequestRepository: Repository<MatrixRequest>) {}

    async create(dto: CreateMatrixRequestDto): Promise<MatrixRequest> {
        const matrixRequest: MatrixRequest = this.matrixRequestRepository.create({
            name: dto.name,
            matrix: dto.matrix,
            status: MatrixRequestStatus.PENDING,
        });

        return await this.matrixRequestRepository.save(matrixRequest);
    }

    async findAll(user: User): Promise<MatrixRequestListItemDto[]> {
        const requests: MatrixRequest[] = await this.matrixRequestRepository.find({
            where: {
                matrix: {
                    user: {
                        id: user.id,
                    },
                },
            },
            relations: ['matrix'],
            order: { requestedAt: 'DESC' },
        });

        return requests.map((r) => new MatrixRequestListItemDto(r.id, r.name, r.requestedAt, r.status, r.finishedAt));
    }

    //Internal use only
    async findOne(id: number): Promise<MatrixRequest> {
        const matrixRequest: MatrixRequest | null = await this.matrixRequestRepository.findOne({ where: { id } });

        if (!matrixRequest) throw new NotFoundException(`MatrixRequest with id ${id} not found`);

        return matrixRequest;
    }

    async updateStatus(id: number, dto: UpdateMatrixRequestStatusDto): Promise<ResponseMessage> {
        const { status, finishedAt, error } = dto;

        const matrixRequest: MatrixRequest = await this.findOne(id);

        matrixRequest.status = status;

        if (error) matrixRequest.error = error;

        const terminalStatuses: MatrixRequestStatus[] = [MatrixRequestStatus.COMPLETED, MatrixRequestStatus.FAILED];
        if (terminalStatuses.includes(status)) {
            matrixRequest.finishedAt = finishedAt ? new Date(finishedAt) : new Date();
        }

        await this.matrixRequestRepository.save(matrixRequest);

        return new ResponseMessage(`MatrixRequest ${id} status updated to ${status}`);
    }

    async addTaskId(id: number, taskId: string): Promise<void> {
        const matrixRequest: MatrixRequest = await this.findOne(id);
        matrixRequest.taskId = taskId;
        await this.matrixRequestRepository.save(matrixRequest);
    }

    async countToday(): Promise<number> {
        const start: Date = new Date();
        start.setHours(0, 0, 0, 0);
        const end: Date = new Date();
        end.setHours(23, 59, 59, 999);
        return this.matrixRequestRepository.count({ where: { requestedAt: Between(start, end) } });
    }

    async findActiveByUser(user: User): Promise<MatrixRequestListItemDto[]> {
        const requests: MatrixRequest[] = await this.matrixRequestRepository.find({
            where: {
                matrix: { user: { id: user.id } },
                status: In([MatrixRequestStatus.PENDING, MatrixRequestStatus.PROCESSING]),
            },
            relations: ['matrix'],
            order: { requestedAt: 'DESC' },
        });

        return requests.map((r) => new MatrixRequestListItemDto(r.id, r.name, r.requestedAt, r.status, r.finishedAt));
    }

    async findFailedByUser(user: User): Promise<MatrixRequestListItemDto[]> {
        const requests: MatrixRequest[] = await this.matrixRequestRepository.find({
            where: {
                matrix: { user: { id: user.id } },
                status: MatrixRequestStatus.FAILED,
            },
            relations: ['matrix'],
            order: { requestedAt: 'DESC' },
        });

        return requests.map((r) => new MatrixRequestListItemDto(r.id, r.name, r.requestedAt, r.status, r.finishedAt));
    }
}
