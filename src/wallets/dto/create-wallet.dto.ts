
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateWalletDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ enum: ['CASH', 'BANK', 'CREDIT_CARD', 'SAVING'] })
    @IsNotEmpty()
    @IsEnum(['CASH', 'BANK', 'CREDIT_CARD', 'SAVING'])
    type: string;

    @ApiProperty({ default: 0 })
    @IsOptional()
    @IsNumber()
    initialBalance?: number;

    @ApiProperty({ default: 'VND' })
    @IsOptional()
    @IsString()
    currency?: string;

    // Credit Card Specifics
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    creditLimit?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    statementDate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    paymentDueDate?: number;
}
