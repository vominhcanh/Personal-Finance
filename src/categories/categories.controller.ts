import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('v1/categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    create(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(req.user.userId, createCategoryDto);
    }

    @Get()
    async findAll(@Request() req, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Category>> {
        return this.categoriesService.findAll(req.user.userId, pageOptionsDto);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.categoriesService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoriesService.update(id, req.user.userId, updateCategoryDto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.categoriesService.remove(id, req.user.userId);
    }
}
