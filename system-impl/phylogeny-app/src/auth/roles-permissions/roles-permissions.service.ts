import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ResponseMessage } from 'src/common/dtos/response-message';
import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';
import { RolesService } from 'src/auth/roles/roles.service';
import { PermissionsService } from 'src/auth/permissions/permissions.service';
import { Role } from 'src/auth/roles/entities/role.entity';
import { Permission } from 'src/auth/permissions/entities/permission.entity';

import { CreateRolesPermissionDto } from './dto/create-roles-permission.dto';
import { UpdateRolesPermissionDto } from './dto/update-roles-permission.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { RolesPermission } from './entities/roles-permission.entity';
import { ResponseRolesPermissionDto } from './dto/response-roles-permission.dto';

@Injectable()
export class RolesPermissionsService {
    constructor(
        @InjectRepository(RolesPermission) private readonly rolesPermissionRepository: Repository<RolesPermission>,
        private readonly rolesService: RolesService,
        private readonly permissionsService: PermissionsService,
    ) {}

    async create(createRolesPermissionDto: CreateRolesPermissionDto): Promise<ResponseMessage> {
        const { roleId, permissionId } = createRolesPermissionDto;

        //Do both lookups in parallel since they are independent
        await Promise.all([this.rolesService.ensureExists(roleId), this.permissionsService.ensureExists(permissionId)]);

        //Check if that mapping already exists to prevent duplicates
        const existing = await this.rolesPermissionRepository.findOne({
            where: {
                role: { id: roleId },
                permission: { id: permissionId },
            },
        });

        if (existing) throw new DbIntegrityException('This role-permission mapping already exists.');

        const newMapping = this.rolesPermissionRepository.create({
            role: { id: roleId },
            permission: { id: permissionId },
        });

        await this.rolesPermissionRepository.save(newMapping);

        return new ResponseMessage('Role-permission mapping created successfully.');
    }

    async findAll(): Promise<ResponseRolesPermissionDto[]> {
        const mappings = await this.rolesPermissionRepository.find({ relations: ['role', 'permission'] });

        return mappings.map((m) => new ResponseRolesPermissionDto(m.role?.id, m.permission?.id));
    }

    async findOne(id: number): Promise<ResponseRolesPermissionDto> {
        const mapping = await this.rolesPermissionRepository.findOne({
            where: { id },
            relations: ['role', 'permission'],
        });

        if (!mapping) throw new NotFoundException(`The entered roles-permission ID ${id} wasn't found.`);

        return new ResponseRolesPermissionDto(mapping.role?.id, mapping.permission?.id);
    }

    async update(id: number, updateRolesPermissionDto: UpdateRolesPermissionDto): Promise<ResponseMessage> {
        const mapping = await this.rolesPermissionRepository.findOne({
            where: { id },
            relations: ['role', 'permission'],
        });

        if (!mapping) throw new NotFoundException(`The entered roles-permission ID ${id} wasn't found.`);

        const newRoleId = updateRolesPermissionDto.roleId ?? mapping.role?.id;
        const newPermissionId = updateRolesPermissionDto.permissionId ?? mapping.permission?.id;

        // validate referenced entities if they are changing
        if (updateRolesPermissionDto.roleId && updateRolesPermissionDto.roleId !== mapping.role?.id) {
            await this.rolesService.findOne(updateRolesPermissionDto.roleId);
        }

        if (updateRolesPermissionDto.permissionId && updateRolesPermissionDto.permissionId !== mapping.permission?.id) {
            await this.permissionsService.findOne(updateRolesPermissionDto.permissionId);
        }

        // check duplicates
        const duplicate = await this.rolesPermissionRepository.findOne({
            where: {
                role: { id: newRoleId } as unknown as Role,
                permission: { id: newPermissionId } as unknown as Permission,
            },
            relations: ['role', 'permission'],
        });

        if (duplicate && duplicate.id !== id) {
            throw new DbIntegrityException(
                'A roles-permission mapping with the provided role and permission already exists.',
            );
        }

        mapping.role = { id: newRoleId } as Role;
        mapping.permission = { id: newPermissionId } as Permission;

        await this.rolesPermissionRepository.save(mapping);

        return new ResponseMessage('Role-permission mapping updated successfully.');
    }

    async remove(id: number): Promise<ResponseMessage> {
        const mapping = await this.rolesPermissionRepository.findOne({
            where: { id },
            relations: ['role', 'permission'],
        });

        if (!mapping) throw new NotFoundException(`The entered roles-permission ID ${id} wasn't found.`);

        await this.rolesPermissionRepository.delete(id);

        return new ResponseMessage('Role-permission mapping deleted successfully.');
    }

    async setPermissionsForRole(
        roleId: number,
        setRolePermissionsDto: SetRolePermissionsDto,
    ): Promise<ResponseMessage> {
        await this.rolesService.ensureExists(roleId);

        await Promise.all(
            setRolePermissionsDto.permissionIds.map((permissionId: number) =>
                this.permissionsService.ensureExists(permissionId),
            ),
        );

        await this.rolesPermissionRepository.delete({ role: { id: roleId } });

        if (setRolePermissionsDto.permissionIds.length > 0) {
            const newMappings: RolesPermission[] = setRolePermissionsDto.permissionIds.map((permissionId: number) =>
                this.rolesPermissionRepository.create({
                    role: { id: roleId },
                    permission: { id: permissionId },
                }),
            );

            await this.rolesPermissionRepository.save(newMappings);
        }

        return new ResponseMessage(`Permissions for role ID ${roleId} updated successfully.`);
    }
}
