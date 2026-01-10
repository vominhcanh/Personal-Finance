
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DebtInstallmentDocument = DebtInstallment & Document;

@Schema()
export class DebtInstallment {
    @Prop({ type: Types.ObjectId, ref: 'Debt', required: true })
    debtId: Types.ObjectId;

    @Prop({ required: true })
    dueDate: Date;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true, enum: ['PENDING', 'PAID', 'OVERDUE'], default: 'PENDING' })
    status: string;

    @Prop()
    paidAt: Date;
}

export const DebtInstallmentSchema = SchemaFactory.createForClass(DebtInstallment);
