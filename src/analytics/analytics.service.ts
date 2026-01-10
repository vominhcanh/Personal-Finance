
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { Debt, DebtDocument } from '../debts/schemas/debt.schema';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
    ) { }

    async getMonthlyOverview(userId: string) {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        return this.transactionModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    date: { $gte: start },
                },
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                },
            },
        ]);
    }

    async getCreditCardFees(userId: string) {
        // Assuming fees are expenses with specific note or type?
        // Requirement "Sum all expense transactions related to Credit Card Settlement Fees"
        // We can filter by note 'Settlement Fee' or use specific logic if we had a fee category.
        // For now, filter by note contains 'Fee' or strictly 'Settlement Fee'.
        return this.transactionModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    type: 'EXPENSE',
                    note: /fee/i, // Regex match 'fee' case insensitive
                },
            },
            {
                $group: {
                    _id: null,
                    totalFees: { $sum: '$amount' },
                },
            },
        ]);
    }

    async getDebtStatus(userId: string) {
        return this.debtModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    status: 'ONGOING'
                }
            },
            {
                $group: {
                    _id: '$type',
                    totalRemaining: { $sum: '$remainingAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);
    }
}
