
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema()
export class Wallet {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['CASH', 'BANK', 'CREDIT_CARD', 'SAVING', 'DEBIT_CARD', 'PREPAID_CARD'] })
    type: string;

    @Prop({ required: true, default: 0 })
    balance: number;

    @Prop({ required: true, default: 0 })
    initialBalance: number;

    @Prop({ default: 'VND' })
    currency: string;

    @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'LOCKED'] })
    status: string;

    // --- Card Specifics ---
    @Prop()
    bankName: string; // Issuing Bank

    @Prop()
    maskedNumber: string; // **** 1234

    @Prop()
    cardType: string; // VISA, MASTER, JCB...

    @Prop()
    issuanceDate: Date;

    @Prop()
    expirationDate: Date;

    // Credit Card Specifics
    @Prop()
    creditLimit: number;

    @Prop()
    statementDate: number;

    @Prop()
    paymentDueDate: number;

    @Prop()
    interestRate: number; // %/year

    @Prop()
    annualFee: number;

    @Prop()
    defaultSettlementFee: number;

    // Supplementary Card
    @Prop({ type: Types.ObjectId, ref: 'Wallet' })
    linkedWalletId: Types.ObjectId;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
