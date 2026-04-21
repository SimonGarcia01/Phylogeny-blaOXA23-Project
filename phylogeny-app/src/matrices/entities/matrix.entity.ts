import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    OneToOne,
    OneToMany,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Visualization } from 'src/visualizations/entities/visualization.entity';
import { MatrixRequest } from 'src/matrix-requests/entities/matrix-request.entity';

@Entity('matrices')
export class Matrix {
    @PrimaryGeneratedColumn()
    id!: number;

    // Public identifier (used in APIs)
    @Column({ name: 'matrix_id', length: 20, nullable: false, unique: true })
    matrixId!: string;

    @Column({ name: 'name', length: 100, nullable: false })
    name!: string;

    @Column({ name: 'description', length: 255, nullable: true })
    description?: string;

    // Object storage reference (MinIO)
    @Column({ name: 'object_key', type: 'text', nullable: false })
    objectKey!: string;

    @Column({ name: 'file_size', type: 'int', nullable: true })
    fileSize?: number;

    @Column({ name: 'mime_type', length: 50, nullable: true })
    mimeType?: string;

    @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp' })
    uploadedAt!: Date;

    @ManyToOne(() => User, (user) => user.matrices, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToOne(() => Visualization, (visualization) => visualization.matrix, { nullable: true })
    visualization?: Visualization;

    @OneToMany(() => MatrixRequest, (matrixRequest) => matrixRequest.matrix)
    matrixRequests!: MatrixRequest[];
}
