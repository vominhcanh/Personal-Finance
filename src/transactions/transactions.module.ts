
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
        WalletsModule,
    ],
    providers: [TransactionsService],
    controllers: [TransactionsController],
    exports: [TransactionsService],
})
export class TransactionsModule { }
