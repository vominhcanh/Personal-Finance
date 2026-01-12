
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDebtDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    partnerName: string; // The person you owe or who owes you

    @ApiProperty({ enum: ['LOAN', 'LEND'] })
    @IsNotEmpty()
    @IsEnum(['LOAN', 'LEND'])
    type: string; // LOAN (You borrowed), LEND (You lent)

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    totalAmount: number;

    @ApiProperty({ required: false, enum: ['ONGOING', 'COMPLETED'] })
    @IsOptional()
    @IsEnum(['ONGOING', 'COMPLETED'])
    status?: string;

    // Installment Details
    @ApiProperty({ default: 0 })
    @ApiProperty()
    @IsNumber()
    isInstallment: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    totalMonths?: number;

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    startDate?: string; // ISO date string

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    monthlyPayment?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    paymentDate?: number; // Day of month (e.g., 5th)
}
