import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Role } from 'src/auth/roles/entities/role.entity';
import { Permission } from 'src/auth/permissions/entities/permission.entity';

@Entity('roles_permissions')
export class RolesPermission {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Role, (role) => role.rolesPermission, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role!: Role;

    @ManyToOne(() => Permission, (permission) => permission.rolePermissions, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'permission_id' })
    permission!: Permission;
}
