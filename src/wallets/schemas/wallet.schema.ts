
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema()
export class Wallet {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['CASH', 'BANK', 'CREDIT_CARD', 'SAVING'] })
    type: string;

    @Prop({ required: true, default: 0 })
    balance: number;

    @Prop({ required: true, default: 0 })
    initialBalance: number;

    @Prop({ default: 'VND' })
    currency: string;

    // Credit Card Specifics
    @Prop()
    creditLimit: number;

    @Prop()
    statementDate: number;

    @Prop()
    paymentDueDate: number;

    @Prop()
    defaultSettlementFee: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
