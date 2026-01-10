
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
    @IsNotEmpty()
    @IsEnum(['INCOME', 'EXPENSE'])
    type: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    color?: string;
}
