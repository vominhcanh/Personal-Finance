
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema()
export class Transaction {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
    walletId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    categoryId: Types.ObjectId;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true, enum: ['INCOME', 'EXPENSE', 'TRANSFER'] })
    type: string;

    @Prop({ required: true, default: Date.now })
    date: Date;

    @Prop()
    note: string;

    @Prop([String])
    images: string[];

    // For Settlement / Transfer logic
    @Prop({ type: Types.ObjectId, ref: 'Wallet' })
    targetWalletId: Types.ObjectId;

    @Prop()
    feeRate: number;

    @Prop()
    feeAmount: number;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
