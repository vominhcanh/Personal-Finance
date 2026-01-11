
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { Transaction } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    create(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
        return this.transactionsService.create(req.user.userId, createTransactionDto);
    }

    @Get()
    async findAll(@Request() req, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Transaction>> {
        return this.transactionsService.findAll(req.user.userId, pageOptionsDto);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.transactionsService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
        return this.transactionsService.update(id, req.user.userId, updateTransactionDto);
    }

    @Get('stats/wallet/:id/overview')
    @ApiOperation({ summary: 'Get overview stats (Total Tx, Income, Expense) for a wallet' })
    async getWalletOverview(@Request() req, @Param('id') id: string) {
        return this.transactionsService.getStatsOverview(req.user.userId, id);
    }

    @Get('stats/wallet/:id/categories')
    @ApiOperation({ summary: 'Get spending breakdown by category for a wallet' })
    async getWalletCategoryStats(
        @Request() req,
        @Param('id') id: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string
    ) {
        return this.transactionsService.getStatsByCategories(req.user.userId, id, fromDate, toDate);
    }

    @Get('stats/cards/summary')
    @ApiOperation({ summary: 'Get summary stats for ALL wallets/cards' })
    async getCardsSummary(@Request() req) {
        return this.transactionsService.getCardsSummary(req.user.userId);
    }

    @Post('seed/:walletId')
    @ApiOperation({ summary: 'Generate random transactions for a wallet (Testing)' })
    async seedTransactions(@Request() req, @Param('walletId') walletId: string) {
        return this.transactionsService.seedTransactions(req.user.userId, walletId);
    }


    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.transactionsService.remove(id, req.user.userId);
    }
}
