
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    passwordHash: string;

    @Prop()
    fullName: string;

    @Prop()
    dateOfBirth: Date;

    @Prop({ enum: ['MALE', 'FEMALE', 'OTHER'] })
    gender: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: 0 })
    monthlyLimit: number; // Hạn mức chi tiêu hàng tháng
}

export const UserSchema = SchemaFactory.createForClass(User);
