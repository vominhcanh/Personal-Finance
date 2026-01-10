
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PageOptionsDto {
    @ApiPropertyOptional({ minimum: 1, default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    readonly page?: number = 1;

    @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    @IsOptional()
    readonly per_page?: number = 20;

    get skip(): number {
        // Default to 1 and 20 if undefined (though default above handles it mostly, accessors need care)
        const p = this.page || 1;
        const pp = this.per_page || 20;
        return (p - 1) * pp;
    }
}
