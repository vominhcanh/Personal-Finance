import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BankDocument = Bank & Document;

@Schema({ timestamps: true })
export class Bank {
    @Prop({ required: true, unique: true })
    id: number; // Bank ID from VietQR

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    code: string;

    @Prop()
    bin: string;

    @Prop()
    shortName: string;

    @Prop()
    logo: string;

    @Prop()
    transferSupported: number;

    @Prop()
    lookupSupported: number;

    @Prop()
    short_name: string;

    @Prop()
    support: number;

    @Prop()
    isTransfer: number;

    @Prop()
    swift_code: string;
}

export const BankSchema = SchemaFactory.createForClass(Bank);
