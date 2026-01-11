import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    dateOfBirth?: Date;

    @ApiProperty({ enum: ['MALE', 'FEMALE', 'OTHER'], required: false })
    @IsOptional()
    @IsEnum(['MALE', 'FEMALE', 'OTHER'])
    gender?: string;
}
