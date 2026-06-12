import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

import type { User } from 'src/auth/users/entities/user.entity';
import type { Matrix } from 'src/matrices/entities/matrix.entity';

@Entity('visualizations')
@Unique(['name', 'user'])
export class Visualization {
    @PrimaryGeneratedColumn()
    id!: number;

    //Public identifier
    @Column({ name: 'visualization_id', type: 'uuid', nullable: false, unique: true })
    visualizationId!: string;

    @Column({ name: 'name', length: 100, nullable: false })
    name!: string;

    @Column({ name: 'description', length: 1000, nullable: true })
    description?: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @Column({ name: 'object_key', type: 'text', nullable: false })
    objectKey!: string;

    @Column({ name: 'file_size', type: 'int', nullable: true })
    fileSize?: number;

    @Column({ name: 'mime_type', length: 50, nullable: true })
    mimeType?: string;

    @ManyToOne('User', (user: User) => user.visualizations, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToOne('Matrix', (matrix: Matrix) => matrix.visualization)
    matrix!: Matrix;
}
