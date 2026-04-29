import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { User } from 'src/auth/users/entities/user.entity';
import { RolesPermission } from 'src/auth/roles-permissions/entities/roles-permission.entity';

export enum RoleName {
    ADMIN = 'Admin',
    RESEARCHER = 'Researcher',
}

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'enum', enum: RoleName, name: 'name', nullable: false, unique: true })
    name!: RoleName;

    @Column({ name: 'description', length: 255, nullable: true })
    description!: string;

    @OneToMany(() => User, (user) => user.role, { eager: false, onDelete: 'SET NULL' })
    users!: User;

    @OneToMany(() => RolesPermission, (rolesPermission) => rolesPermission.role, { eager: false, onDelete: 'CASCADE' })
    rolesPermissions!: RolesPermission[];
}
