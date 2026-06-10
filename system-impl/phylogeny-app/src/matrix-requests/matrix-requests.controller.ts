import { Controller, Get, Body, Param, UseGuards, ParseIntPipe, Patch } from '@nestjs/common';

import { Permissions } from 'src/common/decorators/permissions.decorator';
import { Internal } from 'src/common/decorators/internal.decorator';
import { InternalSecretGuard } from 'src/common/guards/internal-secret.guard';
import { ResponseMessage } from 'src/common/dtos/response-message';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/auth/users/entities/user.entity';

import { MatrixRequestsService } from './matrix-requests.service';
import { UpdateMatrixRequestStatusDto } from './dto/status-update.dto';
import { MatrixRequestListItemDto } from './dto/response-m-r-list-item.dto';

@Controller('matrix-requests')
export class MatrixRequestsController {
    constructor(private readonly matrixRequestsService: MatrixRequestsService) {}
    @Get()
    @Permissions('MATRIX_REQUESTS_READ')
    async findAll(@CurrentUser() user: User): Promise<MatrixRequestListItemDto[]> {
        return await this.matrixRequestsService.findAll(user);
    }

    // Internal-only: FastAPI updates the job status
    @Patch(':id/status')
    @Internal()
    @UseGuards(InternalSecretGuard)
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateMatrixRequestStatusDto,
    ): Promise<ResponseMessage> {
        return await this.matrixRequestsService.updateStatus(id, dto);
    }
}
