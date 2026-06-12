import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import type { Matrix } from 'src/matrices/entities/matrix.entity';

export enum MatrixRequestStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Entity('matrix_requests')
export class MatrixRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'name', length: 30, nullable: false })
    name!: string;

    @CreateDateColumn({ name: 'requested_at', type: 'timestamp', nullable: false })
    requestedAt!: Date;

    @CreateDateColumn({ name: 'finished_at', type: 'timestamp', nullable: true })
    finishedAt?: Date;

    @Column({ name: 'task_id', type: 'varchar', length: 255, nullable: true })
    taskId?: string;

    @Column({ name: 'status', type: 'enum', enum: MatrixRequestStatus, nullable: false })
    status!: MatrixRequestStatus;

    @Column({ name: 'error', type: 'text', nullable: true })
    error?: string;

    @ManyToOne('Matrix', (matrix: Matrix) => matrix.matrixRequests, { nullable: false })
    @JoinColumn({ name: 'matrix_id' })
    matrix!: Matrix;
}
