import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SeoAgencyProfile,
  SeoService,
  SeoServiceCategory,
} from '../../database/entities';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SeoAgencyProfile,
      SeoService,
      SeoServiceCategory,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
