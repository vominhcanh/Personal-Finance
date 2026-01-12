
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

import { BanksModule } from '../banks/banks.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
        BanksModule,
        forwardRef(() => TransactionsModule),
    ],
    providers: [WalletsService],
    controllers: [WalletsController],
    exports: [WalletsService],
})
export class WalletsModule { }
