import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ResponseMessage } from 'src/common/dtos/response-message';
import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';
import { ResponsePermissionDto } from './dto/response-permission.dto';

@Injectable()
export class PermissionsService {
    constructor(@InjectRepository(Permission) private readonly permissionRepository: Repository<Permission>) {}

    async create(createPermissionDto: CreatePermissionDto): Promise<ResponseMessage> {
        const nameExists: Permission | null = await this.permissionRepository.findOneBy({
            name: createPermissionDto.name,
        });

        if (nameExists) throw new DbIntegrityException('A permission with the provided name already exists.');

        const newPermission: Permission = this.permissionRepository.create(createPermissionDto);

        const savedPermission: Permission = await this.permissionRepository.save(newPermission);

        return new ResponseMessage(`Permission ${savedPermission.name} created successfully.`);
    }

    async count(): Promise<number> {
        return this.permissionRepository.count();
    }

    async findAll(): Promise<ResponsePermissionDto[]> {
        const permissions: Permission[] = await this.permissionRepository.find();

        return permissions.map((p) => new ResponsePermissionDto(p.id, p.name, p.description));
    }

    async findOne(permissionId: number): Promise<ResponsePermissionDto> {
        const permission: Permission | null = await this.permissionRepository.findOneBy({ id: permissionId });

        if (!permission) throw new NotFoundException(`The entered permission ID ${permissionId} wasn't found.`);

        return new ResponsePermissionDto(permission.id, permission.name, permission.description);
    }

    async update(permissionId: number, updatePermissionDto: UpdatePermissionDto): Promise<ResponseMessage> {
        const permission: Permission | null = await this.permissionRepository.findOneBy({ id: permissionId });

        if (!permission) throw new NotFoundException(`The entered permission ID ${permissionId} wasn't found.`);

        if (updatePermissionDto.name && updatePermissionDto.name !== permission.name) {
            const exists = await this.permissionRepository.findOneBy({ name: updatePermissionDto.name });
            if (exists && exists.id !== permissionId) {
                throw new DbIntegrityException('A permission with the provided name already exists.');
            }
        }

        await this.permissionRepository.update(permissionId, updatePermissionDto);

        return new ResponseMessage(`The permission with the name ${permission.name} has been updated successfully.`);
    }

    async remove(permissionId: number): Promise<ResponseMessage> {
        const permission: Permission | null = await this.permissionRepository.findOneBy({ id: permissionId });

        if (!permission) throw new NotFoundException(`The entered permission ID ${permissionId} wasn't found.`);

        await this.permissionRepository.delete(permissionId);

        return new ResponseMessage(`The permission with name ${permission.name} was deleted successfully.`);
    }

    async ensureExists(permissionId: number): Promise<void> {
        const permission: Permission | null = await this.permissionRepository.findOneBy({ id: permissionId });
        if (!permission) throw new NotFoundException(`The entered permission ID ${permissionId} wasn't found.`);
    }
}
