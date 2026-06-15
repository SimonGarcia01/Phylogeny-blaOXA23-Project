import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import type { Matrix } from 'src/matrices/entities/matrix.entity';
import type { Visualization } from 'src/visualizations/entities/visualization.entity';
import type { Role } from 'src/auth/roles/entities/role.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'first_name', length: 20, nullable: false })
    firstName!: string;

    @Column({ name: 'last_name', length: 20, nullable: false })
    lastName!: string;

    @Column({ name: 'email', length: 50, nullable: false, unique: true })
    email!: string;

    @Column({ name: 'encrypted_password', length: 255, nullable: false })
    encryptedPassword!: string;

    @OneToMany('Matrix', (matrix: Matrix) => matrix.user, { eager: false, onDelete: 'CASCADE' })
    matrices!: Matrix[];

    @OneToMany('Visualization', (visualization: Visualization) => visualization.user, {
        eager: false,
        onDelete: 'CASCADE',
    })
    visualizations!: Visualization[];

    @ManyToOne('Role', (role: Role) => role.users, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'role_id' })
    role!: Role;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
