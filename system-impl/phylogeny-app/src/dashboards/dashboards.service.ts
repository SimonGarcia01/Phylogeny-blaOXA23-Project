import { Injectable } from '@nestjs/common';

import { User } from 'src/auth/users/entities/user.entity';

@Injectable()
export class DashboardsService {
    findAll() {
        return `This action returns all dashboards`;
    }

    findUserStats(user: User) {
        throw new Error('Method not implemented.');
    }
}
