import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from 'src/auth/users/entities/user.entity';
import { Matrix } from 'src/matrices/entities/matrix.entity';

@Entity('visualizations')
export class Visualization {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'name', length: 30, nullable: false })
    name!: string;

    @Column({ name: 'description', length: 100, nullable: true })
    description?: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @Column({ name: 'object_key', type: 'text', nullable: false })
    objectKey!: string;

    @Column({ name: 'file_size', type: 'int', nullable: true })
    fileSize?: number;

    @Column({ name: 'mime_type', length: 50, nullable: true })
    mimeType?: string;

    @ManyToOne(() => User, (user) => user.visualizations, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToOne(() => Matrix, (matrix) => matrix.visualization, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'matrix_id' })
    matrix?: Matrix;
}
