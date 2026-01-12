
import { Body, Controller, Get, NotFoundException, Patch, Post, Request, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateLimitDto } from './dto/update-limit.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getMe(@Request() req) {
        const user = await this.usersService.findOne(req.user.email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const { passwordHash, ...result } = user.toObject();
        return result;
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update current user profile' })
    async updateMe(@Request() req, @Body() updateUserDto: UpdateUserDto) {
        const user = await this.usersService.update(req.user.email, updateUserDto);
        if (!user) {
            throw new UnprocessableEntityException('User could not be updated or not found');
        }
        const { passwordHash, ...result } = user.toObject();
        return result;
    }

    @Post('change-password')
    @ApiOperation({ summary: 'Change current user password' })
    async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
        await this.usersService.changePassword(req.user.email, changePasswordDto);
        return { message: 'Đổi mật khẩu thành công' };
    }

    @Patch('monthly-limit')
    @ApiOperation({ summary: 'Update monthly spending limit' })
    async updateMonthlyLimit(@Request() req, @Body() payload: UpdateLimitDto) {
        const user = await this.usersService.updateMonthlyLimit(req.user.email, payload.monthlyLimit);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return {
            message: 'Cập nhật hạn mức thành công',
            monthlyLimit: user.monthlyLimit
        };
    }

    // Keep legacy profile endpoint redirecting to getMe logic if needed, or remove.
    // User asked for "get me", so /me is perfect.
    // I will remove the old /profile if it conflicts or just leave it.
    // The previous code had @Get('profile'). I will replace it with the above.
}
