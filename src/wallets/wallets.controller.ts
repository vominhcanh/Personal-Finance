
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { Wallet } from './schemas/wallet.schema';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@ApiTags('wallets')
@ApiBearerAuth()
@Controller('v1/wallets')
export class WalletsController {
    constructor(private readonly walletsService: WalletsService) { }

    @Post()
    create(@Request() req, @Body() createWalletDto: CreateWalletDto) {
        return this.walletsService.create(req.user.userId, createWalletDto);
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

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.walletsService.remove(id, req.user.userId);
    }
}
