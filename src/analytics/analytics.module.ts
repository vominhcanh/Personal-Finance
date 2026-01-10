
import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { DebtsModule } from '../debts/debts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { Debt, DebtSchema } from '../debts/schemas/debt.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Transaction.name, schema: TransactionSchema },
            { name: Debt.name, schema: DebtSchema }
        ]),
        TransactionsModule,
        DebtsModule
    ],
    providers: [AnalyticsService],
    controllers: [],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
