
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async create(email: string, passwordHash: string): Promise<UserDocument> {
        const newUser = new this.userModel({ email, passwordHash });
        return newUser.save();
    }

    async update(email: string, updateUserDto: UpdateUserDto): Promise<UserDocument | null> {
        return this.userModel.findOneAndUpdate({ email }, updateUserDto, { new: true }).exec();
    }

    async changePassword(email: string, changePasswordDto: ChangePasswordDto): Promise<void> {
        const user = await this.findOne(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const isMatch = await bcrypt.compare(changePasswordDto.oldPassword, user.passwordHash);
        if (!isMatch) {
            throw new BadRequestException('Old password is incorrect');
        }

        const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);
        user.passwordHash = newPasswordHash;
        await user.save();
    }

    async findOne(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }
}
