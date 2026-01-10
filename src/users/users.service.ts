
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async create(email: string, passwordHash: string): Promise<UserDocument> {
        const newUser = new this.userModel({ email, passwordHash });
        return newUser.save();
    }

    async findOne(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }
}
