import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
    ) {}

    async create(createUserDto: CreateUserDto) {
        const emailExists = await this.userRepository.findOneBy({ email: createUserDto.email });

        if(emailExists) throw new 

        const saltRounds = parseInt(this.configService.get<string>('SALT_ROUNDS') ?? '10');
        const encryptedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

        return await this.userRepository.save(newUser);
    }

    async findAll() {
        return await this.userRepository.find();
    }

    async findOne(userId: number) {
        return await this.userRepository.findOneBy({ id: userId });
    }

    async update(userId: number, updateUserDto: UpdateUserDto) {
        return await this.userRepository.update(userId, updateUserDto);
    }

    async remove(userId: number) {
        return await this.userRepository.delete(userId);
    }
}
