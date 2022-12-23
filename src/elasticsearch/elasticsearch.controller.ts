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
import { ElasticSearchService } from './elasticsearch.service';

@Controller('elasticsearch')
export class ElasticSearchController {
  constructor(private readonly elasticSearchService: ElasticSearchService) {}

  @Get('index')
  async get() {
    return await this.elasticSearchService.indexProducts();
  }

  @Get('search')
  async search(@Query() query: QueryDTO) {
    const { search = '', limit = 20, offset = 0, min, max } = query;
    return await this.elasticSearchService.search({
      search,
      limit,
      offset,
      min,
      max,
    });
  }

  @Get('getall')
  async getAll() {
    return await this.elasticSearchService.getAllIndex();
  }

  @Post('index-one')
  async indexOne(@Body() product: ProductDTO) {
    return await this.elasticSearchService.indexOne(product);
  }

  @Put('update-one')
  async updateOne(@Body() product: ProductDTO) {
    return await this.elasticSearchService.updateIndex(product);
  }

  @Delete('remove-one/:id')
  async removeOne(@Param() params) {
    const { id } = params;
    return await this.elasticSearchService.removeIndex(id);
  }

  @Delete('clearall')
  async clearAll() {
    return await this.elasticSearchService.clearAllIndex();
  }
}
