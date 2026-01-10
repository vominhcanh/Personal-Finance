
import { Controller, Get, Request, UseGuards, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    async getProfile(@Request() req) {
        // req.user is set by JwtAuthGuard
        // We might want to fetch full details from DB excluding password
        const user = await this.usersService.findOne(req.user.email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        // user includes passwordHash, we should sanitize it.
        // For simplicity now, just return what we have or transform.
        const { passwordHash, ...result } = user.toObject();
        return result;
    }
}
