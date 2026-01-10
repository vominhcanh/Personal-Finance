
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { PageDto } from '../common/dto/page.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class WalletsService {
    constructor(@InjectModel(Wallet.name) private walletModel: Model<WalletDocument>) { }

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

        const updatedWallet = await this.walletModel.findOneAndUpdate(
            { _id: id, userId: new Types.ObjectId(userId) },
            updateWalletDto,
            { new: true },
        ).exec();

        if (!updatedWallet) {
            throw new NotFoundException(`Wallet #${id} not found`);
        }
        return updatedWallet;
    }

    async remove(id: string, userId: string): Promise<Wallet> {
        // Potential check: Does it have transactions?
        // For now, allow delete.
        const deletedWallet = await this.walletModel.findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) }).exec();
        if (!deletedWallet) {
            throw new NotFoundException(`Wallet #${id} not found`);
        }
        return deletedWallet;
    }
}
