
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Debt, DebtDocument } from '../debts/schemas/debt.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Wallet, WalletDocument } from '../wallets/schemas/wallet.schema';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
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

    async getSpendingWarning(userId: string) {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const monthlyLimit = user.monthlyLimit || 0;

        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        // Calculate total Expense
        const expenseAgg = await this.transactionModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    type: 'EXPENSE',
                    date: { $gte: start }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const currentSpending = expenseAgg.length > 0 ? expenseAgg[0].total : 0;
        let percentUsed = 0;
        if (monthlyLimit > 0) {
            percentUsed = Math.round((currentSpending / monthlyLimit) * 100);
        }

        let alertLevel = 'SAFE';
        if (monthlyLimit > 0) {
            if (percentUsed >= 100) alertLevel = 'OVERSPENT';
            else if (percentUsed >= 80) alertLevel = 'WARNING';
        }

        return {
            currentSpending,
            monthlyLimit,
            percentUsed,
            alertLevel
        };
    }

    async getUpcomingPayments(userId: string) {
        const today = new Date();
        const future10Days = new Date();
        future10Days.setDate(today.getDate() + 10);

        // 1. Credit Cards: Check paymentDueDate
        const creditCards = await this.walletModel.find({
            userId: new Types.ObjectId(userId),
            type: 'CREDIT_CARD',
            status: 'ACTIVE' // Assuming we only care about active cards
        });

        const cardsDue: any[] = [];
        const currentDay = today.getDate();
        const currentMonth = today.getMonth(); // 0-11
        const currentYear = today.getFullYear();

        for (const card of creditCards) {
            if (card.paymentDueDate) {
                // Construct Due Date for THIS month
                // Logic: If paymentDueDate < currentDay? Already passed? Or next month?
                // Requirement: "thông báo trước 10 ngày".
                // So we check usually "Coming Soon".
                // If due date is 25, and today is 20. Diff = 5.
                // If due date is 5, and today is 28. Next month due date is 5. Diff = 7 + 5 = 12?
                // Let's assume simplest logic: Find the NEXT occurrence of Payment Date.

                // Strict Credit Card Logic
                // 1. Determine "Payment Window": After Statement Date -> Before Payment Due Date.
                // Example: Statement 25th Jan. Due 5th Feb.
                // Window: 25 Jan -> 5 Feb.
                // If Today is 26 Jan: In Window. Due Date = 5 Feb.
                // If Today is 1 Feb: In Window. Due Date = 5 Feb.
                // If Today is 10 Feb: Past Due? Or next cycle? Usually next cycle starts 25 Feb.
                // If Today is 20 Jan: Before Window. No Alert needed? Or Early Warning?
                // User requirement: "khi đó thì phần upcoming-payments thì mới ghi nhận luôn thông báo"
                // => Only show if we are IN the window (Today >= StatementDate || Today <= DueDate with wrapping).

                const statementDate = card.statementDate;
                const paymentDate = card.paymentDueDate;

                if (statementDate && paymentDate) {
                    let isWarning = false;
                    let targetDueDate = new Date();

                    // Logic: Find the RELEVANT due date.
                    // Case 1: Statement < Due (Same Month? Rare. Usually Due is next month).
                    // Most common: Statement 25, Due 5 (Next Month).
                    // If Today (26 Jan) > Statement (25): Target Due is Next Month (5 Feb).
                    // If Today (2 Feb) < Due (5): Target Due is This Month (5 Feb).
                    // What if Today (20 Jan)?
                    // Last Statement was 25 Dec. Due was 5 Jan (Passed).
                    // Next Statement is 25 Jan.
                    // So currently NO "Statement Balance" officially locked?
                    // User says: "khi đó ... mới ghi nhận". So ONLY show if statement generated.

                    // Check if we are "Post Statement".
                    // Construct Statement Date for THIS month
                    let currentStatement = new Date(currentYear, currentMonth, statementDate);
                    // If we passed statement date, then we owe for this statement. Due date is next month's paymentDate.
                    // If we are BEFORE statement date, check if we are still paying for PREVIOUS statement?
                    // E.g. Today 2nd. Due 5th. Statement was 25th Prev Month. -> YES.

                    // Algorithm:
                    // 1. Check strict chronological next Due Date.
                    // 2. Check if we are in the "active payment period" for that Due Date.

                    // Let's rely on simple Next Occurrence logic but filter for "Statement Generated".
                    // Actually, if we just look ahead 10-15 days, we implicitly capture the "Close to Due Date" cases.
                    // The user said "thông báo trước 10 ngày".
                    // So if Due Date is 5th, we notify from 25th prev month? YES.
                    // So my existing logic `diffDays <= 10` is ALMOST correct.
                    // I just need to ensure `nextDue` calculation handles the month wrap correctly.

                    let checkDate = new Date(currentYear, currentMonth, paymentDate);
                    // If checkDate < Today, it means due date for this month passed. Next due is next month.
                    if (checkDate < today) {
                        checkDate = new Date(currentYear, currentMonth + 1, paymentDate);
                    }

                    // BUT: If today is 25th Jan. Due date 5th Feb.
                    // `checkDate` (5th Jan) < today. `checkDate` becomes 5th Feb.
                    // Diff = 10 days. Warning triggers. Correct.

                    // If today is 1st Feb. Due 5th Feb.
                    // `checkDate` (5th Feb) > today.
                    // Diff = 4 days. Warning triggers. Correct.

                    // If today is 20th Jan. Due 5th Feb.
                    // `checkDate` (5th Jan) < today. `checkDate` becomes 5th Feb.
                    // Diff = 15 days. > 10. NO Warning. Correct. (Not yet statement date).

                    // So existing Date Logic IS robust for the "10 days before" rule.
                    // However, we MUST handle if `paymentDate` < `statementDate` (Cross month) vs Same Month.
                    // Actually, `paymentDate` simply defines the deadline.
                    // The logic `nextDue` simply finds the next deadline.
                    // If that deadline is close, we warn.
                    // This aligns with "Statement Generated" because Statement is usually 15 days before Due.
                    // So 10 days warning implies Statement already generated.

                    // I will refine the logic to specifically set `targetDueDate` and use it.
                    targetDueDate = checkDate;

                    const diffTime = targetDueDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // Check outstanding balance. If 0, maybe don't warn?
                    // User says: "khi dùng hạn mức đó sẽ có sinh ra dư nợ".
                    // If balance is 0, no need to pay.
                    if (diffDays >= 0 && diffDays <= 10 && (card.outstandingBalance || 0) > 0) {
                        let alertLevel = 'YELLOW';
                        if (diffDays <= 3) alertLevel = 'RED';
                        else if (diffDays <= 7) alertLevel = 'ORANGE';

                        cardsDue.push({
                            type: 'CREDIT_CARD',
                            name: card.name,
                            amount: card.outstandingBalance || 0,
                            dueDate: targetDueDate,
                            daysRemaining: diffDays,
                            alertLevel,
                            walletId: card._id
                        });
                    }
                }
            }
        }

        // 2. Loans (Debts): Check upcoming payment
        // Debt has 'paymentDate' (Number, day of month) based on Schema?
        // Schema: @Prop() paymentDate: number;
        // So logic is SAME as Credit Card.

        const debts = await this.debtModel.find({
            userId: new Types.ObjectId(userId),
            status: 'ONGOING'
        });

        const loansDue: any[] = [];

        for (const debt of debts) {
            if (debt.paymentDate) {
                let nextDue = new Date(currentYear, currentMonth, debt.paymentDate);
                if (nextDue < today) {
                    nextDue = new Date(currentYear, currentMonth + 1, debt.paymentDate);
                }

                const diffTime = nextDue.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 10) {
                    let alertLevel = 'YELLOW';
                    if (diffDays <= 3) alertLevel = 'RED';
                    else if (diffDays <= 7) alertLevel = 'ORANGE';

                    const isInstallment = debt.isInstallment;
                    let installmentInfo: any = undefined;

                    if (isInstallment && debt.totalMonths) {
                        const currentPeriod = (debt.paidMonths || 0) + 1;
                        installmentInfo = {
                            current: currentPeriod,
                            total: debt.totalMonths,
                            display: `${currentPeriod}/${debt.totalMonths}`
                        };
                    }

                    loansDue.push({
                        type: 'LOAN',
                        name: debt.partnerName,
                        amount: debt.monthlyPayment || 0,
                        dueDate: nextDue,
                        daysRemaining: diffDays,
                        alertLevel,
                        debtId: debt._id,
                        installment: installmentInfo
                    });
                }
            }
        }

        // Merge and Sort
        const allDue = [...cardsDue, ...loansDue].sort((a, b) => a.daysRemaining - b.daysRemaining);

        return allDue;
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

    async getTrend(userId: string, period: number = 6) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - period + 1);
        startDate.setDate(1);

        const trendData = await this.transactionModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    income: {
                        $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] }
                    },
                    expense: {
                        $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] }
                    }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        return trendData.map(item => ({
            month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
            income: item.income,
            expense: item.expense
        }));
    }

    async getCategoryBreakdown(userId: string, monthStr?: string) {
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

        // Required: Lookup Category Name from CategoryId
        const breakdown = await this.transactionModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    type: 'EXPENSE',
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $lookup: {
                    from: 'categories', // Ensure this matches actual collection name
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: '$category.name', // Group by Name directly? Or ID? User wants Name.
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        return breakdown.map(item => ({
            categoryName: item._id || 'Uncategorized',
            totalAmount: item.totalAmount
        }));
    }
}
