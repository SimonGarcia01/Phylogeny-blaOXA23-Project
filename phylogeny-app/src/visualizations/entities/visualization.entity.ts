import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
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

    @ManyToOne(() => User, (user) => user.visualizations, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToOne(() => Matrix, (matrix) => matrix.visualization, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'matrix_id' })
    matrix?: Matrix;
}
