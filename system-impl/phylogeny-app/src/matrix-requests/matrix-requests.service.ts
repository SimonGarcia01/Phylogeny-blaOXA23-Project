import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
        const { status, finishedAt } = dto;

        const matrixRequest: MatrixRequest = await this.findOne(id);

        matrixRequest.status = status;
        if (finishedAt) matrixRequest.finishedAt = finishedAt;

        await this.matrixRequestRepository.save(matrixRequest);

        return new ResponseMessage(`MatrixRequest with id ${id} status updated successfully`);
    }
}
