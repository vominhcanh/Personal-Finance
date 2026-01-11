
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
    async getMonthlyTransactions(userId: string, monthStr?: string) { // monthStr: MM-YYYY
        const now = new Date();
        let month = now.getMonth();
        let year = now.getFullYear();

        if (monthStr) {
            const parts = monthStr.split('-');
            if (parts.length === 2) {
                month = parseInt(parts[0]) - 1;
                year = parseInt(parts[1]);
            }
        }

        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0, 23, 59, 59);

        // Aggregation: Group by Day of Month
        const dailyStats = await this.transactionModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { $dayOfMonth: "$date" },
                    income: {
                        $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] }
                    },
                    expense: {
                        $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Return only days with data (User request)
        const result = dailyStats.map(stat => ({
            day: stat._id,
            date: `${year}-${(month + 1).toString().padStart(2, '0')}-${stat._id.toString().padStart(2, '0')}`,
            income: stat.income,
            expense: stat.expense
        }));

        return result;
    }
}
