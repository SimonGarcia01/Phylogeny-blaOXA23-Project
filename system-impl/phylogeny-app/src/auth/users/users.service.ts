import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { ResponseMessage } from 'src/common/dtos/response-message';
import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';
import { RolesService } from 'src/auth/roles/roles.service';

import { Role } from '../roles/entities/role.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { ResponseUserDto } from './dto/response-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
        private readonly roleService: RolesService,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<ResponseMessage> {
        const emailExists: User | null = await this.findByEmail(createUserDto.email);

        if (emailExists) throw new DbIntegrityException('A user with the provided email already exists.');

        const saltRounds: number = parseInt(this.configService.get<string>('SALT_ROUNDS') ?? '10');

        const encryptedPassword: string = await bcrypt.hash(createUserDto.password, saltRounds);

        const role: Role = await this.roleService.findOneByName(createUserDto.role);

        const newUser: User = this.userRepository.create({
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            email: createUserDto.email,
            encryptedPassword: encryptedPassword,
            role: role,
        });

        const savedUser: User = await this.userRepository.save(newUser);

        return new ResponseMessage(`User with email ${savedUser.email} created successfully.`);
    }

    async findAll(): Promise<ResponseUserDto[]> {
        const users: User[] = await this.userRepository.find();

        return users.map((user) => {
            return new ResponseUserDto(user.email, user.firstName, user.lastName);
        });
    }

    async findOneDto(userId: number): Promise<ResponseUserDto> {
        const user: User | null = await this.userRepository.findOneBy({ id: userId });

        if (!user) throw new NotFoundException(`The entered user with ID ${userId} wasn't found.`);

        return new ResponseUserDto(user.email, user.firstName, user.lastName);
    }

    async findOneUser(userId: number): Promise<User> {
        //This one is for internal use only, so we return the full user
        //We include the permissions for the JWT strategy
        const user: User | null = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role', 'role.rolesPermissions', 'role.rolesPermissions.permission'],
        });

        if (!user) throw new NotFoundException(`The entered user with ID ${userId} wasn't found.`);

        return user;
    }

    //This method is use by the AuthService, so it also needs the permissions for the JWT strategy
    async findByEmail(userEmail: string): Promise<User | null> {
        const user: User | null = await this.userRepository.findOne({
            where: { email: userEmail },
            relations: ['role', 'role.rolesPermissions', 'role.rolesPermissions.permission'],
        });
        return user;
    }

    async update(userId: number, updateUserDto: UpdateUserDto): Promise<ResponseMessage> {
        const user: User | null = await this.userRepository.findOneBy({ id: userId });

        if (!user) throw new NotFoundException(`The entered user ID ${userId} wasn't found.`);

        //Remove the role from the updateUserDto since it's a string and the update expects a Role entity
        const { role, ...rest } = updateUserDto;

        //If role does exist in the updateUserDto, we find it and include it in the update
        if (role) {
            const updateRole = await this.roleService.findOneByName(role);

            await this.userRepository.update(userId, {
                ...rest,
                role: updateRole,
            });
        } else {
            //Make an update here without changing the role
            await this.userRepository.update(userId, rest);
        }

        return new ResponseMessage(`The user with the email ${user.email} has been updated successfully.`);
    }

    async remove(userId: number): Promise<ResponseMessage> {
        const user: User | null = await this.userRepository.findOneBy({ id: userId });

        if (!user) throw new NotFoundException(`The entered user ID ${userId} wasn't found.`);

        await this.userRepository.delete(userId);

        return new ResponseMessage(`The user with email ${user.email} was deleted successfully.`);
    }
}
