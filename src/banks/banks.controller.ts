import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { BanksService } from './banks.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('banks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/banks')
export class BanksController {
    constructor(private readonly banksService: BanksService) { }

    @Post('sync')
    @ApiOperation({ summary: 'Sync banks list from VietQR API' })
    async syncBanks() {
        return this.banksService.syncBanks();
    }

    @Get()
    @ApiOperation({ summary: 'Get list of banks with optional keyword search' })
    @ApiQuery({ name: 'keyword', required: false })
    async findAll(@Query('keyword') keyword?: string) {
        return this.banksService.findAll(keyword);
    }
}
