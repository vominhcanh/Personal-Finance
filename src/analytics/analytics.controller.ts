
import { Controller, Get, Request, UseGuards, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('monthly-overview')
    @ApiOperation({ summary: 'Get total income, expense, and balance for the current month' })
    async getMonthlyOverview(@Request() req) {
        return this.analyticsService.getMonthlyOverview(req.user.userId);
    }

    @Get('debt-status')
    @ApiOperation({ summary: 'Get summary of ongoing debts' })
    async getDebtStatus(@Request() req) {
        return this.analyticsService.getDebtStatus(req.user.userId);
    }

    // Note: getCreditCardFees was also in Service, exposing it
    @Get('credit-card-fees')
    @ApiOperation({ summary: 'Get total fees paid for credit cards this month' })
    async getCreditCardFees(@Request() req) {
        return this.analyticsService.getCreditCardFees(req.user.userId);
    }

    @Get('transactions-monthly')
    @ApiOperation({ summary: 'Get daily income/expense for a specific month (MM-YYYY) for Charts' })
    async getMonthlyTransactions(@Request() req, @Query('month') month?: string) {
        return this.analyticsService.getMonthlyTransactions(req.user.userId, month);
    }
}
