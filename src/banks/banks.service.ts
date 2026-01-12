import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { Bank, BankDocument } from './schemas/bank.schema';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BanksService {
    private readonly logger = new Logger(BanksService.name);

    constructor(
        @InjectModel(Bank.name) private bankModel: Model<BankDocument>,
        private readonly httpService: HttpService,
    ) { }

    async syncBanks(): Promise<{ message: string; count: number }> {
        try {
            const response = await lastValueFrom(
                this.httpService.get('https://api.vietqr.io/v2/banks')
            );
            const { data } = response.data;

            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid data format from VietQR API');
            }

            let count = 0;
            // Upsert each bank
            for (const bank of data) {
                await this.bankModel.updateOne(
                    { id: bank.id },
                    { $set: bank },
                    { upsert: true }
                );
                count++;
            }

            return { message: 'Đồng bộ thành công', count };
        } catch (error) {
            this.logger.error('Failed to sync banks', error);
            throw error;
        }
    }

    async findAll(keyword?: string): Promise<Bank[]> {
        const query: any = {};
        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { code: { $regex: keyword, $options: 'i' } },
                { shortName: { $regex: keyword, $options: 'i' } },
                { short_name: { $regex: keyword, $options: 'i' } }
            ];
        }
        return this.bankModel.find(query).sort({ shortName: 1 }).exec();
    }

    async findById(id: string): Promise<Bank | null> {
        return this.bankModel.findById(id).exec();
    }
}
