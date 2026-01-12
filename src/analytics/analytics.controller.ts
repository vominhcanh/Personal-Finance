
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('monthly-overview')
    @ApiOperation({ summary: 'Get total income, expense, and balance for the current month' })
    async getMonthlyOverview(@Request() req, @Query('month') month?: string) {
        return {
            status: 'success',
            data: await this.analyticsService.getMonthlyOverview(req.user.userId, month)
        };
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

    @Get('spending-warning')
    @ApiOperation({ summary: 'Check spending vs monthly limit' })
    async getSpendingWarning(@Request() req) {
        return this.analyticsService.getSpendingWarning(req.user.userId);
    }

    @Get('upcoming-payments')
    @ApiOperation({ summary: 'Get upcoming payments (Credit Cards and Debts)' })
    async getUpcomingPayments(@Request() req) {
        return this.analyticsService.getUpcomingPayments(req.user.userId);
    }

    @Get('trend')
    @ApiOperation({ summary: 'Get income vs expense trend for last N months' })
    async getTrend(@Request() req, @Query('period') period?: number) {
        return this.analyticsService.getTrend(req.user.userId, period);
    }

    @Get('category-breakdown')
    @ApiOperation({ summary: 'Get expense breakdown by category for a month' })
    async getCategoryBreakdown(@Request() req, @Query('month') month?: string) {
        return this.analyticsService.getCategoryBreakdown(req.user.userId, month);
    }
}
