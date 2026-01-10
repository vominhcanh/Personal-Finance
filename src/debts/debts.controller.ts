
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { Debt } from './schemas/debt.schema';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

@ApiTags('debts')
@ApiBearerAuth()
@Controller('v1/debts')
export class DebtsController {
    constructor(private readonly debtsService: DebtsService) { }

    @Post()
    create(@Request() req, @Body() createDebtDto: CreateDebtDto) {
        return this.debtsService.create(req.user.userId, createDebtDto);
    }

    @Get()
    async findAll(@Request() req, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Debt>> {
        return this.debtsService.findAll(req.user.userId, pageOptionsDto);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.debtsService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateDebtDto: UpdateDebtDto) {
        return this.debtsService.update(id, req.user.userId, updateDebtDto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.debtsService.remove(id, req.user.userId);
    }
}
