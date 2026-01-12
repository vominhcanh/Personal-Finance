
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DebtInstallment, DebtInstallmentDocument } from '../debts/schemas/debt-installment.schema';
import { Debt, DebtDocument } from '../debts/schemas/debt.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Wallet, WalletDocument } from '../wallets/schemas/wallet.schema';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
        @InjectModel(DebtInstallment.name) private debtInstallmentModel: Model<DebtInstallmentDocument>,
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
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        const currentDay = now.getDate();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysRemaining = daysInMonth - currentDay;

        // Date Ranges
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

        // 1. Current Spending (Total Expense this month)
        // STRICT FILTER: Exclude Debt Repayments, Refinance, Credit Card Payments.
        // User wants only "Consumption" spending (Food, Shopping, etc.)

        const expenseStats = await this.transactionModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    type: 'EXPENSE',
                    date: { $gte: startOfMonth, $lte: typeof now === 'string' ? new Date(now) : now },
                    // Exclude Notes containing keywords
                    note: { $not: { $regex: /Thanh toán khoản vay|Đáo hạn|Refinance/i } }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // This is now "Consumption Spending"
        const currentSpending = expenseStats.length > 0 ? expenseStats[0].total : 0;

        // 2. Spending Trend (Same period last month)
        const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthSameDay = new Date(currentYear, currentMonth - 1, currentDay, 23, 59, 59);

        const lastMonthSpendingAgg = await this.transactionModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    type: 'EXPENSE',
                    date: { $gte: lastMonthStart, $lte: lastMonthSameDay },
                    note: { $not: { $regex: /Thanh toán khoản vay|Đáo hạn|Refinance/i } } // Apply same filter
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const lastMonthSpending = lastMonthSpendingAgg.length > 0 ? lastMonthSpendingAgg[0].total : 0;

        let spendingTrend = 0;
        if (lastMonthSpending > 0) {
            spendingTrend = parseFloat((((currentSpending - lastMonthSpending) / lastMonthSpending) * 100).toFixed(1));
        } else if (currentSpending > 0) {
            spendingTrend = 100; // 100% increase if last month was 0
        }

        // 3. Upcoming Fixed Payments (REMOVED from Projection)
        // User requested to distinct "Consumption" vs "Debts".
        // We will NOT add upcoming debts to the "Consumption Projection".

        // 4. Calculations with REFINED Logic
        const dailyAverage = currentDay > 0 ? Math.round(currentSpending / currentDay) : 0;

        // Projected Spending = Current Consumption + (DailyAvg * DaysRemaining)
        const projectedSpending = Math.round(currentSpending + (dailyAverage * daysRemaining));

        // Safe Daily Spend
        // (Limit - Current) / DaysRemaining
        // Note: Unless 'Limit' is also adjusted for Debts?
        // We assume 'monthlyLimit' here is the "Consumption Budget".
        const disposableBudget = monthlyLimit - currentSpending;
        const safeDailySpend = daysRemaining > 0 ? Math.max(0, Math.round(disposableBudget / daysRemaining)) : 0;

        // 5. Top Category
        const topCategoryAgg = await this.transactionModel.aggregate([
            { $match: { userId: new Types.ObjectId(userId), type: 'EXPENSE', date: { $gte: startOfMonth, $lte: now } } },
            { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } },
            { $limit: 1 },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
            { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } }
        ]);

        let topCategory: { name: string; amount: number; percent: number } | null = null;
        if (topCategoryAgg.length > 0) {
            const topItem = topCategoryAgg[0];
            topCategory = {
                name: topItem.cat ? topItem.cat.name : 'Khác',
                amount: topItem.total,
                percent: currentSpending > 0 ? Math.round((topItem.total / currentSpending) * 100) : 0
            };
        }

        // 6. Percent Used & Alert
        let percentUsed = 0;
        let alertLevel = 'SAFE';
        if (monthlyLimit > 0) {
            percentUsed = parseFloat(((currentSpending / monthlyLimit) * 100).toFixed(1));
            if (percentUsed >= 100) alertLevel = 'OVERSPENT';
            else if (percentUsed >= 85) alertLevel = 'URGENT';
            else if (percentUsed >= 70) alertLevel = 'WARNING';
        } else {
            alertLevel = 'NO_LIMIT';
        }

        // 7. Advice Message
        let adviceMessage = "Bạn đang chi tiêu hợp lý. Hãy duy trì nhé!";
        if (monthlyLimit === 0) {
            adviceMessage = "Bạn chưa đặt hạn mức tháng. Hãy thiết lập để quản lý chi tiêu hiệu quả hơn.";
        } else if (currentSpending > monthlyLimit) {
            adviceMessage = `Bạn đã vượt hạn mức ${percentUsed}%. Hãy rà soát lại các khoản chi ${topCategory ? `đặc biệt là mục ${topCategory.name}` : ''}.`;
        } else if (projectedSpending > monthlyLimit) {
            const diff = projectedSpending - monthlyLimit;
            adviceMessage = `Dư báo bạn sẽ vượt hạn mức khoảng ${diff.toLocaleString('vi-VN')}đ. Hãy tiết kiệm chi tiêu ${topCategory ? `ở mục ${topCategory.name}` : ''}.`;
        } else if (spendingTrend > 20) {
            adviceMessage = `Bạn đang chi tiêu nhiều hơn ${spendingTrend}% so với cùng kỳ tháng trước. Hãy chú ý nhé.`;
        }

        return {
            currentSpending,
            monthlyLimit,
            percentUsed,
            alertLevel,
            projectedSpending,
            spendingTrend,
            dailyAverage,
            safeDailySpend,
            topCategory,
            adviceMessage
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

        // 2. Loans (Debts): Check upcoming payment based on PENDING Installments
        const debts = await this.debtModel.find({
            userId: new Types.ObjectId(userId),
            status: 'ONGOING'
        });

        const loansDue: any[] = [];
        const debtIds = debts.map(d => d._id);

        if (debtIds.length > 0) {
            // Find PENDING installments for these debts that are due soon?
            // Or just find the NEXT PENDING installment for each debt.
            // User wants: "thông báo trước 10 ngày".
            // So we filter those with diffDays <= 10.

            // Strategy: Get ALL pending installments for these debts, sort by date.
            // Ideally we only want the *earliest* pending per debt?
            // Since we only create ONE pending installment per debt (based on new logic),
            // we can essentially fetch all PENDING installments.

            const pendingInstallments = await this.debtInstallmentModel.find({
                debtId: { $in: debtIds },
                status: 'PENDING'
            }).populate('debtId', 'partnerName totalMonths paidMonths remainingAmount'); // Populate debt info

            for (const installment of pendingInstallments) {
                const dueDate = new Date(installment.dueDate);
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Show if within 10 days (or overdue?)
                // User says: "bắt đầu thông báo kỳ mới trước 10 ngày".
                // Also include OVERDUE items? usually yes.
                if (diffDays <= 10) {
                    let alertLevel = 'YELLOW';
                    if (diffDays <= 3) alertLevel = 'RED';
                    else if (diffDays <= 7) alertLevel = 'ORANGE';

                    const debt = installment.debtId as any;

                    // Construct Installment Info "X/Y"
                    const currentPeriod = (debt.paidMonths || 0) + 1;
                    const installmentInfo = {
                        current: currentPeriod,
                        total: debt.totalMonths,
                        display: `${currentPeriod}/${debt.totalMonths}`
                    };

                    loansDue.push({
                        type: 'LOAN',
                        name: debt.partnerName,
                        amount: installment.amount,
                        dueDate: dueDate,
                        daysRemaining: diffDays,
                        alertLevel,
                        debtId: debt._id,
                        installmentId: installment._id, // Add installmentId for payment action
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
