
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, IsMongoId, IsDateString, IsArray } from 'class-validator';

export class CreateTransactionDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    walletId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    categoryId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @ApiProperty({ enum: ['INCOME', 'EXPENSE', 'TRANSFER'] })
    @IsNotEmpty()
    @IsEnum(['INCOME', 'EXPENSE', 'TRANSFER'])
    type: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDateString()
    date: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiProperty({ required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    // Transfer specific
    @ApiProperty({ required: false })
    @IsOptional()
    @IsMongoId()
    targetWalletId?: string;

    // Credit Card Fee specific
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    feeRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    feeAmount?: number;
}
