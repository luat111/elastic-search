import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProductDTO, QueryDTO } from './dto/product.dto';
import { ElascticSearchService } from './elasticsearch.service';

@Controller('elasticsearch')
export class ElascticSearchController {
  constructor(private readonly elascticSearchService: ElascticSearchService) {}

  @Get('index')
  async get() {
    return await this.elascticSearchService.indexProducts();
  }

  @Get('search')
  async search(@Query() query: QueryDTO) {
    const { search = '', limit = 20, offset = 0, min, max } = query;
    return await this.elascticSearchService.search({
      search,
      limit,
      offset,
      min,
      max,
    });
  }

  @Get('getall')
  async getAll() {
    return await this.elascticSearchService.getAllIndex();
  }

  @Post('index-one')
  async indexOne(@Body() product: ProductDTO) {
    return await this.elascticSearchService.indexOne(product);
  }

  @Put('update-one')
  async updateOne(@Body() product: ProductDTO) {
    return await this.elascticSearchService.updateIndex(product);
  }

  @Delete('remove-one/:id')
  async removeOne(@Param() params) {
    const { id } = params;
    return await this.elascticSearchService.removeIndex(id);
  }

  @Delete('clearall')
  async clearAll() {
    return await this.elascticSearchService.clearAllIndex();
  }
}
