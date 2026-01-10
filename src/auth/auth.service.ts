import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { WalletsService } from '../wallets/wallets.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private categoriesService: CategoriesService,
        private walletsService: WalletsService,
    ) { }

    async register(registerDto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create(registerDto.email, hashedPassword);

        // Auto-seed data
        // Explicitly cast user._id to Types.ObjectId if needed, usually Mongoose handles it but Types helps
        const userId = user._id as Types.ObjectId;
        await this.categoriesService.createDefaultCategories(userId);
        await this.walletsService.createDefaultWallet(userId);

        return this.login(user);
    }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            const { passwordHash, ...result } = user.toObject();
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user._id.toString() };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user._id.toString(),
                email: user.email,
                fullName: user.fullName || null,
                createdAt: user.createdAt,
            }
        };
    }
}
