
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DebtsModule } from '../debts/debts.module';
import { Debt, DebtSchema } from '../debts/schemas/debt.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { TransactionsModule } from '../transactions/transactions.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Wallet, WalletSchema } from '../wallets/schemas/wallet.schema';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Transaction.name, schema: TransactionSchema },
            { name: Debt.name, schema: DebtSchema },
            { name: User.name, schema: UserSchema },
            { name: Wallet.name, schema: WalletSchema }
        ]),
        TransactionsModule,
        DebtsModule
    ],
    providers: [AnalyticsService],
    controllers: [AnalyticsController],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
