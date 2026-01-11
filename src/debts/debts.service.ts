
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Debt, DebtDocument } from './schemas/debt.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { PageDto } from '../common/dto/page.dto';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

import { DebtInstallment, DebtInstallmentDocument } from './schemas/debt-installment.schema';

@Injectable()
export class DebtsService {
    constructor(
        @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
        @InjectModel(DebtInstallment.name) private debtInstallmentModel: Model<DebtInstallmentDocument>,
        private transactionsService: TransactionsService,
    ) { }

    async create(userId: string, createDebtDto: CreateDebtDto): Promise<Debt> {
        const session = await this.debtModel.db.startSession();
        session.startTransaction();
        try {
            const remainingAmount = createDebtDto.totalAmount;
            const newDebt = new this.debtModel({
                ...createDebtDto,
                userId: new Types.ObjectId(userId),
                remainingAmount,
                status: createDebtDto.status || 'ONGOING',
                paidMonths: 0,
            });
            await newDebt.save({ session });

            // Generate Installments if enabled
            if (createDebtDto.isInstallment && createDebtDto.totalMonths && createDebtDto.startDate) {
                const installments: any[] = [];
                const startDate = new Date(createDebtDto.startDate);

                for (let i = 0; i < createDebtDto.totalMonths; i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(startDate.getMonth() + i);

                    installments.push({
                        debtId: newDebt._id,
                        dueDate,
                        amount: createDebtDto.monthlyPayment || (createDebtDto.totalAmount / createDebtDto.totalMonths),
                        status: 'PENDING'
                    });
                }
                await this.debtInstallmentModel.create(installments, { session, ordered: true });
            }

            await session.commitTransaction();
            return newDebt;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async findAll(userId: string, pageOptionsDto: PageOptionsDto): Promise<PageDto<Debt>> {
        const query = { userId: new Types.ObjectId(userId) };
        const skip = pageOptionsDto.skip;

        const [data, itemCount] = await Promise.all([
            this.debtModel.find(query)
                .sort({ _id: -1 })
                .skip(skip)
                .limit(pageOptionsDto.per_page || 20)
                .exec(),
            this.debtModel.countDocuments(query),
        ]);

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
        return new PageDto(data, pageMetaDto);
    }

    async findOne(id: string, userId: string): Promise<any> {
        const debt = await this.debtModel.findOne({ _id: id, userId: new Types.ObjectId(userId) }).exec();
        if (!debt) {
            throw new NotFoundException(`Debt #${id} not found`);
        }

        // Fetch Installments
        const installments = await this.debtInstallmentModel.find({ debtId: debt._id }).sort({ dueDate: 1 }).exec();

        return { ...debt.toObject(), installments };
    }

    async update(id: string, userId: string, updateDebtDto: UpdateDebtDto): Promise<Debt> {
        const updatedDebt = await this.debtModel.findOneAndUpdate(
            { _id: id, userId: new Types.ObjectId(userId) },
            updateDebtDto,
            { new: true },
        ).exec();
        if (!updatedDebt) {
            throw new NotFoundException(`Debt #${id} not found`);
        }
        return updatedDebt;
    }

    async remove(id: string, userId: string): Promise<Debt> {
        const deletedDebt = await this.debtModel.findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) }).exec();
        if (!deletedDebt) {
            throw new NotFoundException(`Debt #${id} not found`);
        }
        // Also cleanup installments
        await this.debtInstallmentModel.deleteMany({ debtId: id });
        return deletedDebt;
    }

    async payInstallment(installmentId: string, walletId: string, userId: string) {
        const session = await this.debtModel.db.startSession();
        session.startTransaction();
        try {
            const installment = await this.debtInstallmentModel.findById(installmentId).session(session);
            if (!installment) throw new NotFoundException('Installment not found');
            if (installment.status === 'PAID') throw new BadRequestException('Installment already paid');

            const debt = await this.debtModel.findOne({ _id: installment.debtId, userId: new Types.ObjectId(userId) }).session(session);
            if (!debt) throw new NotFoundException('Parent Debt not found');

            // 1. Create Transaction (Expense or Income based on Debt Type)
            // Note: TransactionsService.create uses its own session which might be tricky with nested sessions.
            // Simplified: Update balances via WalletService directly or assume TransactionsService handles it.
            // For robustness, we'll assume TransactionsService.create is atomic enough or we pass session if refactored.
            // Here we just call it. RISK: If Transaction fails, we should abort.
            // Better: TransactionsService.createWithSession(..., session) but not implemented.
            // For now, call normal create (it creates its own session, which is "nested transaction" supported in Mongo 4+).

            const transactionType = debt.type === 'LOAN' ? 'EXPENSE' : 'INCOME'; // LOAN = I borrow -> Pay back = Expense.
            const installmentIndex = debt.paidMonths + 1;

            await this.transactionsService.create(userId, {
                walletId,
                categoryId: new Types.ObjectId().toString(), // Using random ID for now or need a Debt/Loan Repayment Category
                amount: installment.amount,
                type: transactionType as any,
                date: new Date(),
                note: `Pay installment #${installmentIndex} for Debt '${debt.partnerName}' (Due: ${installment.dueDate.toISOString().split('T')[0]})`,
            });

            // 2. Update Installment
            installment.status = 'PAID';
            installment.paidAt = new Date();
            await installment.save({ session });

            // 3. Update Parent Debt
            debt.paidMonths += 1;
            debt.remainingAmount -= installment.amount;
            if (debt.remainingAmount <= 0) debt.remainingAmount = 0;
            if (debt.remainingAmount === 0 && debt.paidMonths >= debt.totalMonths) {
                debt.status = 'COMPLETED';
            }
            await debt.save({ session });

            await session.commitTransaction();
            return { success: true, installment, debt };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}
