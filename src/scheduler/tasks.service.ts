
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Debt, DebtDocument } from '../debts/schemas/debt.schema';
import { Wallet, WalletDocument } from '../wallets/schemas/wallet.schema';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
        @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async handleCron() {
        this.logger.debug('Running daily check for due dates...');
        const today = new Date().getDate();
        // Simplified check: if paymentDate equals today's day of month

        // Check Debts
        const dueDebts = await this.debtModel.find({ paymentDate: today, status: 'ONGOING' });
        dueDebts.forEach(debt => {
            this.logger.log(`Debt Due Reminder: ${debt.partnerName} - Amount: ${debt.monthlyPayment}`);
        });

        // Check Credit Cards
        const dueCCs = await this.walletModel.find({ type: 'CREDIT_CARD', paymentDueDate: today });
        dueCCs.forEach(cc => {
            this.logger.log(`Credit Card Due Reminder: ${cc.name}`);
        });
    }
}
