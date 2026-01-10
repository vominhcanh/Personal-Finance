
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, IsMongoId, IsDateString, IsBoolean } from 'class-validator';

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
    @ApiProperty({ default: false })
    @IsOptional()
    @IsBoolean()
    isInstallment?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    totalMonths?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    monthlyPayment?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    paymentDate?: number; // Day of month (e.g., 5th)
}
