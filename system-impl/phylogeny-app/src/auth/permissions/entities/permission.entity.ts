import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { RolesPermission } from 'src/auth/roles-permissions/entities/roles-permission.entity';

@Entity('permissions')
export class Permission {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'name', length: 50, nullable: false, unique: true })
    name!: string;

    @Column({ name: 'description', length: 255, nullable: true })
    description!: string;

    @OneToMany(() => RolesPermission, (rolesPermission) => rolesPermission.permission, {
        eager: false,
        onDelete: 'CASCADE',
    })
    rolesPermission!: RolesPermission[];
}
