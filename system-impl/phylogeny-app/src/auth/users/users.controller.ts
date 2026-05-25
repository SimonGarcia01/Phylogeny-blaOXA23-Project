import { Controller, Get, Post, Body } from '@nestjs/common';

import { Permissions } from 'src/common/decorators/permissions.decorator';
import { ResponseMessage } from 'src/common/dtos/response-message';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
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

    // @Get(':id')
    // async findOne(@Param('id') id: string) {
    //     return await this.usersService.findOne(+id);
    // }

    // @Patch(':id')
    // async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    //     return await this.usersService.update(+id, updateUserDto);
    // }

    // @Delete(':id')
    // async remove(@Param('id') id: string) {
    //     return await this.usersService.remove(+id);
    // }
}
