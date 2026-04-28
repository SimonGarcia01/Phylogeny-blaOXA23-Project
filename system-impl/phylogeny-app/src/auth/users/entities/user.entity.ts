import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Matrix } from 'src/matrices/entities/matrix.entity';
import { Visualization } from 'src/visualizations/entities/visualization.entity';
import { Role } from 'src/auth/roles/entities/role.entity';

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

    @OneToMany(() => Matrix, (matrix) => matrix.user, { eager: false, onDelete: 'CASCADE' })
    matrices!: Matrix[];

    @OneToMany(() => Visualization, (visualization) => visualization.user, { eager: false, onDelete: 'CASCADE' })
    visualizations!: Visualization[];

    @ManyToOne(() => Role, (role) => role.users, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'role_id' })
    role!: Role;
}
