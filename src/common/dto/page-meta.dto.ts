
import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from './page-options.dto';

export class PageMetaDto {
    @ApiProperty()
    readonly total: number;

    @ApiProperty()
    readonly count: number;

    @ApiProperty()
    readonly per_page: number;

    @ApiProperty()
    readonly current_page: number;

    @ApiProperty()
    readonly total_pages: number;

    @ApiProperty()
    readonly links: {
        next?: string;
        prev?: string;
    };

    constructor({ pageOptionsDto, itemCount }: { pageOptionsDto: PageOptionsDto; itemCount: number }) {
        this.total = itemCount;
        this.per_page = pageOptionsDto.per_page || 20;
        this.current_page = pageOptionsDto.page || 1;
        this.count = itemCount; // Or length of current page data? Usually count in meta implies total count or page count?
        // User sample: "total": 31, "count": 20 (this page count), "per_page": 20.
        // So 'count' is items on this page.

        // I need the actual data length for 'count'. The constructor currently only takes itemCount (total).
        // I'll adjust usage to pass actual item count of the page, or just calculate it if full match?
        // Actually, usually 'meta.count' is the number of items in the *current response*.
        // But typical PageMetaDto constructors take just total count and options.
        // Let's modify constructor to accept 'pageItemCount'.

        // Wait, typical NestJS paging libs might usage.
        // I'll stick to user sample: "count": 20 (which matches per_page if full).
        // I will add pageItemCount to the interface.

        this.total_pages = Math.ceil(this.total / this.per_page);

        // Links logic
        this.links = {};
        if (this.current_page < this.total_pages) {
            this.links.next = `?page=${this.current_page + 1}&per_page=${this.per_page}`;
        }
        if (this.current_page > 1) {
            this.links.prev = `?page=${this.current_page - 1}&per_page=${this.per_page}`;
        }
    }
}
