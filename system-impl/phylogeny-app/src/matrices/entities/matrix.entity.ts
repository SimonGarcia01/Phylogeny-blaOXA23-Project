import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    OneToOne,
    OneToMany,
    Unique,
} from 'typeorm';

import type { User } from 'src/auth/users/entities/user.entity';
import type { Visualization } from 'src/visualizations/entities/visualization.entity';
import type { MatrixRequest } from 'src/matrix-requests/entities/matrix-request.entity';

@Entity('matrices')
@Unique(['name', 'user'])
export class Matrix {
    @PrimaryGeneratedColumn()
    id!: number;

    // Public identifier
    @Column({ name: 'matrix_id', type: 'uuid', nullable: false, unique: true })
    matrixId!: string;

    @Column({ name: 'name', length: 100, nullable: false })
    name!: string;

    @Column({ name: 'description', length: 1000, nullable: true })
    description?: string;

    // Object storage reference (MinIO)
    @Column({ name: 'object_key', length: 100, nullable: false })
    objectKey!: string;

    @Column({ name: 'file_size', type: 'int', nullable: true })
    fileSize?: number;

    @Column({ name: 'mime_type', length: 50, nullable: true })
    mimeType?: string;

    @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp' })
    uploadedAt!: Date;

    @ManyToOne('User', (user: User) => user.matrices, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToOne('Visualization', (visualization: Visualization) => visualization.matrix, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'visualization_id' })
    visualization?: Visualization;

    @OneToMany('MatrixRequest', (matrixRequest: MatrixRequest) => matrixRequest.matrix, {
        eager: false,
        onDelete: 'CASCADE',
    })
    matrixRequests!: MatrixRequest[];
}
