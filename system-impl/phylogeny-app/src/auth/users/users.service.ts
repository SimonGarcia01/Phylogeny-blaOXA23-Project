import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { ResponseMessage } from 'src/common/dtos/response-message';
import { DbIntegrityException } from 'src/common/exceptions/db-integrity-exception';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { ResponseUserDto } from './dto/response-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<ResponseMessage> {
        const emailExists: User | null = await this.findByEmail(createUserDto.email);

        if (emailExists) throw new DbIntegrityException('A user with the provided email already exists.');

        const saltRounds: number = parseInt(this.configService.get<string>('SALT_ROUNDS') ?? '10');

        const encryptedPassword: string = await bcrypt.hash(createUserDto.password, saltRounds);

        const newUser: User = this.userRepository.create({
            ...createUserDto,
            encryptedPassword: encryptedPassword,
        });

        const savedUser: User = await this.userRepository.save(newUser);

        const responseMessage: ResponseMessage = new ResponseMessage(
            `User with email ${savedUser.email} created successfully.`,
        );

        return responseMessage;
    }

    async findAll(): Promise<ResponseUserDto[]> {
        const users: User[] = await this.userRepository.find();

        return users.map((user) => {
            return new ResponseUserDto(user.email, user.firstName, user.lastName);
        });
    }

    async findOne(userId: number): Promise<ResponseUserDto> {
        const user: User | null = await this.userRepository.findOneBy({ id: userId });

        if (!user) throw new NotFoundException(`The entered user with ID ${userId} wasn't found.`);

        return new ResponseUserDto(user.email, user.firstName, user.lastName);
    }

    async findByEmail(userEmail: string): Promise<User> {
        const user: User | null = await this.userRepository.findOneBy({ email: userEmail });

        if (!user) throw new NotFoundException(`The entered user email ${userEmail} wasn't found.`);

        return user;
    }

    async update(userId: number, updateUserDto: UpdateUserDto): Promise<ResponseMessage> {
        const user: User | null = await this.userRepository.findOneBy({ id: userId });

        if (!user) throw new NotFoundException(`The entered user ID ${userId} wasn't found.`);

        await this.userRepository.update(userId, updateUserDto);

        return new ResponseMessage(`The user with the email ${user.email} has been updated successfully.`);
    }

    async remove(userId: number): Promise<ResponseMessage> {
        const user: User | null = await this.userRepository.findOneBy({ id: userId });

        if (!user) throw new NotFoundException(`The entered user ID ${userId} wasn't found.`);

        await this.userRepository.delete(userId);

        return new ResponseMessage(`The user with email ${user.email} was deleted successfully.`);
    }
}
