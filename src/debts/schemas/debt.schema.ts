
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DebtDocument = Debt & Document;

@Schema()
export class Debt {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    partnerName: string;

    @Prop({ required: true, enum: ['LOAN', 'LEND'] })
    type: string;

    @Prop({ required: true })
    totalAmount: number;

    @Prop({ required: true })
    remainingAmount: number;

    @Prop({ required: true, enum: ['ONGOING', 'COMPLETED'], default: 'ONGOING' })
    status: string;

    // Installment Config
    @Prop({ default: 0 })
    isInstallment: number; // 1: Installment, 0: One-time

    @Prop()
    startDate: Date;

    @Prop()
    totalMonths: number;

    @Prop()
    monthlyPayment: number;

    @Prop()
    paymentDate: number;

    @Prop({ default: 0 })
    paidMonths: number;
}

export const DebtSchema = SchemaFactory.createForClass(Debt);
