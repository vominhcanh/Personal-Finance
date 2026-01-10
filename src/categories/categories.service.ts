
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { PageDto } from '../common/dto/page.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) { }

    async createDefaultCategories(userId: Types.ObjectId) {
        const defaults = [
            { name: 'Food & Dining', type: 'EXPENSE', icon: 'utensils', color: '#FF5733', userId },
            { name: 'Transportation', type: 'EXPENSE', icon: 'bus', color: '#33C1FF', userId },
            { name: 'Salary', type: 'INCOME', icon: 'briefcase', color: '#28B463', userId },
        ];
        await this.categoryModel.insertMany(defaults);
    }

    async create(userId: string, createCategoryDto: CreateCategoryDto): Promise<Category> {
        const newCategory = new this.categoryModel({
            ...createCategoryDto,
            userId: new Types.ObjectId(userId),
        });
        return newCategory.save();
    }

    async findAll(userId: string, pageOptionsDto: PageOptionsDto): Promise<PageDto<Category>> {
        const query = { userId: new Types.ObjectId(userId) };
        const skip = pageOptionsDto.skip;

        const [data, itemCount] = await Promise.all([
            this.categoryModel.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(pageOptionsDto.per_page || 20)
                .exec(),
            this.categoryModel.countDocuments(query),
        ]);

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
        return new PageDto(data, pageMetaDto);
    }

    async findOne(id: string, userId: string): Promise<Category> {
        const category = await this.categoryModel.findOne({ _id: id, userId: new Types.ObjectId(userId) }).exec();
        if (!category) {
            throw new NotFoundException(`Category #${id} not found`);
        }
        return category;
    }

    async update(id: string, userId: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const updatedCategory = await this.categoryModel.findOneAndUpdate(
            { _id: id, userId: new Types.ObjectId(userId) },
            updateCategoryDto,
            { new: true },
        ).exec();
        if (!updatedCategory) {
            throw new NotFoundException(`Category #${id} not found`);
        }
        return updatedCategory;
    }

    async remove(id: string, userId: string): Promise<Category> {
        const deletedCategory = await this.categoryModel.findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) }).exec();
        if (!deletedCategory) {
            throw new NotFoundException(`Category #${id} not found`);
        }
        return deletedCategory;
    }
}
