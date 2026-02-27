import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryResolver } from './product-category.resolver';
import { CategorySchema } from '../../schemas/Product-Category.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: 'Category', schema: CategorySchema }]),
  ],
  providers: [ProductCategoryService, ProductCategoryResolver],
  exports: [ProductCategoryService],
})
export class ProductCategoryModule {}
