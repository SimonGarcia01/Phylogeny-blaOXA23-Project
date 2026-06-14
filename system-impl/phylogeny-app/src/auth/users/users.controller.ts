import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';

import { Permissions } from 'src/common/decorators/permissions.decorator';
import { ResponseMessage } from 'src/common/dtos/response-message';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @Permissions('USERS_CREATE')
    async create(@Body() createUserDto: CreateUserDto): Promise<ResponseMessage> {
        return await this.usersService.create(createUserDto);
    }

    @Get()
    @Permissions('USERS_READ')
    async findAll(): Promise<ResponseUserDto[]> {
        return await this.usersService.findAll();
    }

    @Get(':id')
    @Permissions('USERS_READ')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseUserDto> {
        return await this.usersService.findOneDto(id);
    }

    @Patch(':id')
    @Permissions('USERS_UPDATE')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<ResponseMessage> {
        return await this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @Permissions('USERS_DELETE')
    async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseMessage> {
        return await this.usersService.remove(id);
    }
}
