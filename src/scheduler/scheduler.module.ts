
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { DebtsModule } from '../debts/debts.module';
import { WalletsModule } from '../wallets/wallets.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Debt, DebtSchema } from '../debts/schemas/debt.schema';
import { Wallet, WalletSchema } from '../wallets/schemas/wallet.schema';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        MongooseModule.forFeature([
            { name: Debt.name, schema: DebtSchema },
            { name: Wallet.name, schema: WalletSchema }
        ]),
        DebtsModule,
        WalletsModule,
    ],
    providers: [TasksService],
})
export class SchedulerModule { }
