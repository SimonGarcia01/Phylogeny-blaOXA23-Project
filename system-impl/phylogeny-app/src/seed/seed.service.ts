import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { ResponseMessage } from 'src/common/dtos/response-message';
import { Role, RoleName } from 'src/auth/roles/entities/role.entity';
import { Permission } from 'src/auth/permissions/entities/permission.entity';
import { RolesPermission } from 'src/auth/roles-permissions/entities/roles-permission.entity';
import { User } from 'src/auth/users/entities/user.entity';

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
        @InjectRepository(Permission) private readonly permissionRepository: Repository<Permission>,
        @InjectRepository(RolesPermission) private readonly rolesPermissionRepository: Repository<RolesPermission>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
    ) {}

    async seed(): Promise<ResponseMessage> {
        // Prevent accidental re-seed
        const already = await this.roleRepository.findOneBy({ name: RoleName.ADMIN });
        if (already) return new ResponseMessage('Seed already applied (admin role exists).');

        // Entities to create CRUD permissions for
        const entities = [
            'MATRICES',
            'MATRIX_REQUESTS',
            'VISUALIZATIONS',
            'USERS',
            'ROLES',
            'ROLES_PERMISSIONS',
            'PERMISSIONS',
        ];

        const actions = ['READ', 'CREATE', 'UPDATE', 'DELETE'];

        const permissionsToCreate: Partial<Permission>[] = [];
        for (const e of entities) {
            for (const a of actions) {
                permissionsToCreate.push({ name: `${e}_${a}`, description: `${a} permission for ${e.toLowerCase()}` });
            }
        }

        const permissionEntities = this.permissionRepository.create(permissionsToCreate as Permission[]);
        const savedPermissions = await this.permissionRepository.save(permissionEntities);

        // Create roles
        const adminRole = this.roleRepository.create({ name: RoleName.ADMIN, description: 'Administrator' });
        const researcherRole = this.roleRepository.create({ name: RoleName.RESEARCHER, description: 'Researcher' });

        const [savedAdminRole, savedResearcherRole] = await this.roleRepository.save([adminRole, researcherRole]);

        // Assign permissions to roles
        const rolesPermissionsToSave: RolesPermission[] = [];

        // Admin gets all permissions
        for (const p of savedPermissions) {
            rolesPermissionsToSave.push(this.rolesPermissionRepository.create({ role: savedAdminRole, permission: p }));
        }

        // Researcher gets only domain entity permissions (not admin-related entities)
        for (const p of savedPermissions) {
            if (
                p.name.startsWith('MATRICES_') ||
                p.name.startsWith('MATRIX_REQUESTS_') ||
                p.name.startsWith('VISUALIZATIONS_')
            ) {
                rolesPermissionsToSave.push(
                    this.rolesPermissionRepository.create({ role: savedResearcherRole, permission: p }),
                );
            }
        }

        await this.rolesPermissionRepository.save(rolesPermissionsToSave);

        // Create users
        const saltRounds: number = parseInt(this.configService.get<string>('SALT_ROUNDS') ?? '10');

        const adminPassword = await bcrypt.hash('Admin1234', saltRounds);
        const researcherPassword = await bcrypt.hash('Researcher123', saltRounds);

        const adminUser = this.userRepository.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            encryptedPassword: adminPassword,
            role: savedAdminRole,
        });

        const researcher1 = this.userRepository.create({
            firstName: 'Researcher',
            lastName: 'One',
            email: 'researcher1@example.com',
            encryptedPassword: researcherPassword,
            role: savedResearcherRole,
        });

        const researcher2 = this.userRepository.create({
            firstName: 'Researcher',
            lastName: 'Two',
            email: 'researcher2@example.com',
            encryptedPassword: researcherPassword,
            role: savedResearcherRole,
        });

        await this.userRepository.save([adminUser, researcher1, researcher2]);

        return new ResponseMessage('Database seeded successfully.');
    }
}
