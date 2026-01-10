
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema()
export class Category {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['INCOME', 'EXPENSE'] })
    type: string;

    @Prop()
    icon: string;

    @Prop()
    color: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
