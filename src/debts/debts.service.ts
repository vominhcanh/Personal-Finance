
import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { Debt, DebtDocument } from './schemas/debt.schema';

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
            let remainingAmount = createDebtDto.totalAmount;
            let paidMonths = 0;
            const installments: any[] = [];

            // Installment Logic Calculation BEFORE saving Debt
            if (createDebtDto.isInstallment === 1 && createDebtDto.totalMonths && createDebtDto.startDate) {
                const startDate = new Date(createDebtDto.startDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const monthlyPayment = createDebtDto.monthlyPayment || (createDebtDto.totalAmount / createDebtDto.totalMonths);

                // Iterate through Total Months to categorize Past vs Future
                // BUT user wants: "sinh ra lịch sử... và thông tin của kỳ kế tiếp"
                // So we loop until we find the FIRST future/current installment?
                // Or loop all? User said "bỏ việc map ra danh sách kỳ vay".
                // Logic:
                // 1. Identify "Past" periods (Due Date < Today). Create as PAID history.
                // 2. Identify "Current/Next" period (First Due Date >= Today). Create as PENDING.
                // 3. Stop. Do not create further future periods.

                for (let i = 0; i < createDebtDto.totalMonths; i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(startDate.getMonth() + i);

                    // Reset time to end of day or check strictly date?
                    // Let's assume dueDate is compared to today.

                    if (dueDate < today) {
                        // PAST -> History (PAID)
                        // Assume paid? Yes: "những kỳ bắt đầu đó thì sẽ hoàn thành thanh toán rồi"
                        installments.push({
                            // debtId will be assigned later
                            dueDate,
                            amount: monthlyPayment,
                            status: 'PAID',
                            paidAt: dueDate, // Assume paid on due date
                        });
                        paidMonths++;
                        remainingAmount -= monthlyPayment;
                    } else {
                        // CURRENT/FUTURE -> Create ONE Pending Installment
                        installments.push({
                            dueDate,
                            amount: monthlyPayment,
                            status: 'PENDING'
                        });
                        // Stop loop. "thông tin kỳ kế tiếp là được"
                        break;
                    }
                }

                // Safety clamp
                if (remainingAmount < 0) remainingAmount = 0;
            }

            const newDebt = new this.debtModel({
                ...createDebtDto,
                userId: new Types.ObjectId(userId),
                remainingAmount,
                status: remainingAmount <= 0 ? 'COMPLETED' : (createDebtDto.status || 'ONGOING'),
                paidMonths,
            });
            await newDebt.save({ session });

            // Save Generated Installments
            if (installments.length > 0) {
                const installmentsWithId = installments.map(i => ({ ...i, debtId: newDebt._id }));
                await this.debtInstallmentModel.create(installmentsWithId, { session, ordered: true });
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
        const installments = await this.debtInstallmentModel.find({ debtId: debt._id })
            .sort({ dueDate: 1 })
            .populate('walletId', 'name type color logo') // Populate key fields
            .exec();

        return { ...debt.toObject(), installments };
    }

    async update(id: string, userId: string, updateDebtDto: UpdateDebtDto): Promise<Debt> {
        // Prevent updating critical fields for installments to avoid logic break
        if (updateDebtDto.isInstallment !== undefined || updateDebtDto.totalMonths !== undefined || updateDebtDto.startDate) {
            const existingDebt = await this.debtModel.findOne({ _id: id, userId: new Types.ObjectId(userId) });
            if (existingDebt && existingDebt.isInstallment === 1) {
                // If it's an installment debt, forbid changing structure
                if (updateDebtDto.totalMonths || updateDebtDto.startDate || updateDebtDto.isInstallment === 0) {
                    throw new BadRequestException('Cannot modify installment configuration (Total Months, Start Date, Type) for active debts.');
                }
            }
        }

        const updatedDebt = await this.debtModel.findOneAndUpdate(
            { _id: id, userId: new Types.ObjectId(userId) },
            updateDebtDto,
            { new: true },
        ).exec();
        if (!updatedDebt) {
            throw new UnprocessableEntityException(`Debt #${id} could not be updated or does not exist`);
        }
        return updatedDebt;
    }

    async remove(id: string, userId: string): Promise<Debt> {
        const deletedDebt = await this.debtModel.findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) }).exec();
        if (!deletedDebt) {
            throw new UnprocessableEntityException(`Debt #${id} could not be deleted or does not exist`);
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
            if (!installment) throw new UnprocessableEntityException('Installment not found');
            if (installment.status === 'PAID') throw new BadRequestException('Installment already paid');

            const debt = await this.debtModel.findOne({ _id: installment.debtId, userId: new Types.ObjectId(userId) }).session(session);
            if (!debt) throw new UnprocessableEntityException('Parent Debt not found');
            const transactionType = debt.type === 'LOAN' ? 'EXPENSE' : 'INCOME'; // LOAN = I borrow -> Pay back = Expense.
            const installmentIndex = debt.paidMonths + 1;

            await this.transactionsService.create(userId, {
                walletId,
                categoryId: new Types.ObjectId().toString(), // Using random ID for now or need a Debt/Loan Repayment Category
                amount: installment.amount,
                type: transactionType as any,
                date: new Date(),
                note: `Thanh toán khoản vay ${debt.partnerName} kỳ ${installmentIndex}`,
            });

            // 2. Update Installment
            installment.status = 'PAID';
            installment.paidAt = new Date();
            installment.walletId = new Types.ObjectId(walletId); // Record the wallet used
            await installment.save({ session });

            // 3. Update Parent Debt
            debt.paidMonths += 1;
            debt.remainingAmount -= installment.amount;
            if (debt.remainingAmount <= 0) debt.remainingAmount = 0;
            if (debt.paidMonths >= debt.totalMonths || debt.remainingAmount === 0) {
                debt.status = 'COMPLETED';
            } else {

                if (debt.startDate) { // Ensure startDate exists (added to schema)
                    const nextDueDate = new Date(debt.startDate);
                    nextDueDate.setMonth(nextDueDate.getMonth() + debt.paidMonths); // paidMonths is now count of paid. Next is index = paidMonths.

                    const monthlyPayment = debt.monthlyPayment || (debt.totalAmount / debt.totalMonths); // Recalculate or use stored? Stored better.

                    await this.debtInstallmentModel.create([{
                        debtId: debt._id,
                        dueDate: nextDueDate,
                        amount: debt.monthlyPayment || monthlyPayment,
                        status: 'PENDING'
                    }], { session });
                }
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
