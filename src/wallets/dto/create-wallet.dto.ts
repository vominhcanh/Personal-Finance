
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, Min, IsDateString, IsMongoId } from 'class-validator';

export class CreateWalletDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ enum: ['CASH', 'BANK', 'CREDIT_CARD', 'SAVING', 'DEBIT_CARD', 'PREPAID_CARD'] })
    @IsNotEmpty()
    @IsEnum(['CASH', 'BANK', 'CREDIT_CARD', 'SAVING', 'DEBIT_CARD', 'PREPAID_CARD'])
    type: string;

    @ApiProperty({ default: 0 })
    @IsOptional()
    @IsNumber()
    initialBalance?: number;

    @ApiProperty({ default: 'VND' })
    @IsOptional()
    @IsString()
    currency?: string;

    // --- Card Details ---
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    bankName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    maskedNumber?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    cardType?: string; // VISA, MASTER

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    issuanceDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    expirationDate?: string;

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

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    interestRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    annualFee?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsMongoId()
    linkedWalletId?: string;

    @ApiProperty({ enum: ['ACTIVE', 'LOCKED'], required: false })
    @IsOptional()
    @IsEnum(['ACTIVE', 'LOCKED'])
    status?: string;
}
