
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Debt, DebtSchema } from './schemas/debt.schema';
import { DebtInstallment, DebtInstallmentSchema } from './schemas/debt-installment.schema';
import { DebtsService } from './debts.service';
import { DebtsController } from './debts.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Debt.name, schema: DebtSchema },
            { name: DebtInstallment.name, schema: DebtInstallmentSchema }
        ]),
        TransactionsModule,
    ],
    providers: [DebtsService],
    controllers: [DebtsController],
    exports: [DebtsService],
})
export class DebtsModule { }
