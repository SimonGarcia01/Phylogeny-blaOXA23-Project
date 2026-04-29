import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { Role } from 'src/auth/roles/entities/role.entity';
import { Permission } from 'src/auth/permissions/entities/permission.entity';

@Unique(['role', 'permission'])
@Entity('roles_permissions')
export class RolesPermission {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Role, (role) => role.rolesPermissions, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role!: Role;

    @ManyToOne(() => Permission, (permission) => permission.rolesPermissions, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'permission_id' })
    permission!: Permission;
}
