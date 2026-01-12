
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';

import { BanksModule } from '../banks/banks.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
        BanksModule
    ],
    providers: [WalletsService],
    controllers: [WalletsController],
    exports: [WalletsService],
})
export class WalletsModule { }
