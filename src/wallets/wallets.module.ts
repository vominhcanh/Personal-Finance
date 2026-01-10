
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';

@Module({
    imports: [MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }])],
    providers: [WalletsService],
    controllers: [WalletsController],
    exports: [WalletsService],
})
export class WalletsModule { }
