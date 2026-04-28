import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ResponseMessage } from 'src/common/dtos/response-message';
import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { ResponseRoleDto } from './dto/response-role.dto';

@Injectable()
export class RolesService {
    constructor(@InjectRepository(Role) private readonly roleRepository: Repository<Role>) {}

    async create(createRoleDto: CreateRoleDto): Promise<ResponseMessage> {
        const nameExists: Role | null = await this.roleRepository.findOneBy({ name: createRoleDto.name });

        if (nameExists) throw new DbIntegrityException('A role with the provided name already exists.');

        const newRole: Role = this.roleRepository.create(createRoleDto);

        const savedRole: Role = await this.roleRepository.save(newRole);

        return new ResponseMessage(`Role ${savedRole.name} created successfully.`);
    }

    async findAll(): Promise<ResponseRoleDto[]> {
        const roles: Role[] = await this.roleRepository.find();

        return roles.map((r) => new ResponseRoleDto(r.name, r.description));
    }

    async findOne(roleId: number): Promise<ResponseRoleDto> {
        const role: Role | null = await this.roleRepository.findOneBy({ id: roleId });

        if (!role) throw new NotFoundException(`The entered role ID ${roleId} wasn't found.`);

        return new ResponseRoleDto(role.name, role.description);
    }

    async update(roleId: number, updateRoleDto: UpdateRoleDto): Promise<ResponseMessage> {
        const role: Role | null = await this.roleRepository.findOneBy({ id: roleId });

        if (!role) throw new NotFoundException(`The entered role ID ${roleId} wasn't found.`);

        if (updateRoleDto.name && updateRoleDto.name !== role.name) {
            const exists = await this.roleRepository.findOneBy({ name: updateRoleDto.name });
            if (exists && exists.id !== roleId) {
                throw new DbIntegrityException('A role with the provided name already exists.');
            }
        }

        await this.roleRepository.update(roleId, updateRoleDto);

        return new ResponseMessage(`The role with the name ${role.name} has been updated successfully.`);
    }

    async remove(roleId: number): Promise<ResponseMessage> {
        const role: Role | null = await this.roleRepository.findOneBy({ id: roleId });

        if (!role) throw new NotFoundException(`The entered role ID ${roleId} wasn't found.`);

        await this.roleRepository.delete(roleId);

        return new ResponseMessage(`The role with name ${role.name} was deleted successfully.`);
    }

    async ensureExists(roleId: number): Promise<void> {
        const role: Role | null = await this.roleRepository.findOneBy({ id: roleId });
        if (!role) throw new NotFoundException(`The entered role ID ${roleId} wasn't found.`);
    }
}
