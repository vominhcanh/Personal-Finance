import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateLimitDto {
    @ApiProperty({ example: 20000000, description: 'User monthly spending limit' })
    @IsNumber()
    @Min(0)
    monthlyLimit: number;
}
