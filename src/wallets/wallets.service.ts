
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Wallet, WalletDocument } from './schemas/wallet.schema';

import { BanksService } from '../banks/banks.service';

@Injectable()
export class WalletsService {
    constructor(
        @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
        private readonly banksService: BanksService
    ) { }

    async createDefaultWallet(userId: Types.ObjectId) {
        const defaultWallet = new this.walletModel({
            userId,
            name: 'Cash',
            type: 'CASH',
            balance: 0,
            initialBalance: 0,
            currency: 'VND',
        });
        return defaultWallet.save();
    }

    async seedCards(userId: string) {
        const debitCard = new this.walletModel({
            userId: new Types.ObjectId(userId),
            name: 'VCB Debit',
            type: 'DEBIT_CARD',
            balance: 5000000,
            initialBalance: 5000000,
            currency: 'VND',
            bankName: 'Vietcombank',
            maskedNumber: '**** 1234',
            cardType: 'VISA',
            issuanceDate: new Date('2023-01-01'),
            expirationDate: new Date('2028-01-01'),
            status: 'ACTIVE'
        });

        const creditCard = new this.walletModel({
            userId: new Types.ObjectId(userId),
            name: 'TPBank EVO',
            type: 'CREDIT_CARD',
            balance: 0, // Current debt or available? Usually Wallet Balance is "Asset". For Credit Card, it is usually 0 or negative (debt). Let's start 0.
            initialBalance: 0,
            currency: 'VND',
            bankName: 'TPBank',
            maskedNumber: '**** 5678',
            cardType: 'VISA',
            creditLimit: 20000000,
            statementDate: 20,
            paymentDueDate: 5,
            interestRate: 28, // 28% year
            annualFee: 0,
            status: 'ACTIVE'
        });

        await Promise.all([debitCard.save(), creditCard.save()]);
        return { message: 'Khởi tạo thẻ thành công', cards: [debitCard, creditCard] };
    }

    async updateBalance(walletId: Types.ObjectId, amount: number, session: any) {
        return this.walletModel.findByIdAndUpdate(
            walletId,
            { $inc: { balance: amount } },
            { session, new: true }
        ).exec();
    }



    async create(userId: string, createWalletDto: CreateWalletDto): Promise<Wallet> {
        // If type is not CREDIT_CARD, balance = initialBalance
        // If CREDIT_CARD, usually balance starts at 0 (debt is negative?) or 0 means no debt.
        // Let's assume balance = initialBalance.
        const balance = createWalletDto.initialBalance || 0;

        // Auto-fill details from Bank if bankId is provided
        if (createWalletDto.bankId) {
            const bank = await this.banksService.findById(createWalletDto.bankId);
            if (bank) {
                // Fill details if not provided by user, or OVERRIDE?
                // User said "dựa vào phần bank thì mình có thể fill những gì qua" -> Auto fill
                createWalletDto.logo = bank.logo;
                // If bankName is not set, use bank.shortName or bank.name
                if (!createWalletDto.bankName) {
                    createWalletDto.bankName = bank.shortName || bank.name;
                }
                // Determine cardType or others? Not really possible from Bank info alone.
            }
        }

        const newWallet = new this.walletModel({
            ...createWalletDto,
            balance,
            userId: new Types.ObjectId(userId),
        });
        return newWallet.save();
    }

    async findAll(userId: string, pageOptionsDto: PageOptionsDto): Promise<PageDto<Wallet>> {
        const query = { userId: new Types.ObjectId(userId) };
        const skip = pageOptionsDto.skip;

        const [data, itemCount] = await Promise.all([
            this.walletModel.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(pageOptionsDto.per_page || 20)
                .exec(),
            this.walletModel.countDocuments(query),
        ]);

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
        return new PageDto(data, pageMetaDto);
    }

    async findOne(id: string, userId: string): Promise<Wallet> {
        const wallet = await this.walletModel.findOne({ _id: id, userId: new Types.ObjectId(userId) }).exec();
        if (!wallet) {
            throw new NotFoundException(`Wallet #${id} not found`);
        }
        return wallet;
    }

    async update(id: string, userId: string, updateWalletDto: UpdateWalletDto): Promise<Wallet> {
        // Warning: Updating initialBalance should probably update current balance difference?
        // For simplicity: Update properties directly. Balance is managed by Transactions usually.
        // But user might want to adjust details.

        // Auto-fill for update as well if bankId is being updated
        if (updateWalletDto.bankId) {
            const bank = await this.banksService.findById(updateWalletDto.bankId);
            if (bank) {
                updateWalletDto.logo = bank.logo;
                if (!updateWalletDto.bankName) {
                    updateWalletDto.bankName = bank.shortName || bank.name;
                }
            }
        }

        const updatedWallet = await this.walletModel.findOneAndUpdate(
            { _id: id, userId: new Types.ObjectId(userId) },
            updateWalletDto,
            { new: true },
        ).exec();

        if (!updatedWallet) {
            throw new UnprocessableEntityException(`Wallet #${id} could not be updated or does not exist`);
        }
        return updatedWallet;
    }

    async remove(id: string, userId: string): Promise<Wallet> {
        // Potential check: Does it have transactions?
        // For now, allow delete.
        const deletedWallet = await this.walletModel.findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) }).exec();
        if (!deletedWallet) {
            throw new UnprocessableEntityException(`Wallet #${id} could not be deleted or does not exist`);
        }
        return deletedWallet;
    }
}
