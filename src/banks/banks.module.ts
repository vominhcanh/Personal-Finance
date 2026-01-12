import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { BanksService } from './banks.service';
import { BanksController } from './banks.controller';
import { Bank, BankSchema } from './schemas/bank.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Bank.name, schema: BankSchema }]),
        HttpModule,
    ],
    controllers: [BanksController],
    providers: [BanksService],
    exports: [BanksService],
})
export class BanksModule { }
