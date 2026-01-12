import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum PayStatementAction {
    PAY_FULL = 'PAY_FULL',
    REFINANCE = 'REFINANCE',
}

export class PayStatementDto {
    @ApiProperty({ enum: PayStatementAction })
    @IsEnum(PayStatementAction)
    @IsNotEmpty()
    action: PayStatementAction;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    sourceWalletId: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    amount: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    refinanceFeeRate?: number;
}
