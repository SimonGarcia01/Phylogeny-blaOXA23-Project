import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import type { Role } from 'src/auth/roles/entities/role.entity';
import type { Permission } from 'src/auth/permissions/entities/permission.entity';

@Unique(['role', 'permission'])
@Entity('roles_permissions')
export class RolesPermission {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne('Role', (role: Role) => role.rolesPermissions, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role!: Role;

    @ManyToOne('Permission', (permission: Permission) => permission.rolesPermissions, {
        eager: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'permission_id' })
    permission!: Permission;
}
