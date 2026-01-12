
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { PayStatementDto } from './dto/pay-statement.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Wallet } from './schemas/wallet.schema';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/wallets')
export class WalletsController {
    constructor(private readonly walletsService: WalletsService) { }

    @Post()
    create(@Request() req, @Body() createWalletDto: CreateWalletDto) {
        return this.walletsService.create(req.user.userId, createWalletDto);
    }

    @Post('seed-cards')
    @ApiOperation({ summary: 'Generate sample Debit/Credit cards' })
    seedCards(@Request() req) {
        return this.walletsService.seedCards(req.user.userId);
    }

    @Get()
    async findAll(@Request() req, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Wallet>> {
        return this.walletsService.findAll(req.user.userId, pageOptionsDto);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.walletsService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
        return this.walletsService.update(id, req.user.userId, updateWalletDto);
    }

    @Post(':id/pay-statement')
    @ApiOperation({ summary: 'Pay Credit Card functionality (Pay Full or Refinance)' })
    payStatement(@Request() req, @Param('id') id: string, @Body() payload: PayStatementDto) {
        return this.walletsService.payStatement(req.user.userId, id, payload);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.walletsService.remove(id, req.user.userId);
    }
}
