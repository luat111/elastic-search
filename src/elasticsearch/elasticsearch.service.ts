import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { default as axios } from 'axios';
import { Product } from 'src/entities/products';
import { ProductDTO, QueryDTO } from './dto/product.dto';

@Injectable()
export class ElasticSearchService {
  index: string = 'products';
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: EntityRepository<Product>,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly configService: ConfigService,
  ) {}

  // Sync Index

  getAll(): Promise<Product[]> {
    return this.productsRepository.findAll();
  }

  getOneProduct(id: string): Promise<Product> {
    return this.productsRepository.findOne({ id: id });
  }

  async settingIndex(index: string): Promise<boolean> {
    try {
      await axios.put(
        `http://localhost:9200/${index}`,
        {
          settings: {
            analysis: {
              analyzer: {
                product_custom_analyzer: {
                  tokenizer: 'standard',
                  char_filter: ['my_char_filter'],
                  filter: ['lowercase', 'classic'],
                },
              },
              char_filter: {
                my_char_filter: {
                  type: 'pattern_replace',
                  pattern: '(\\w+)/(?=\\w)',
                  replacement: '$1',
                },
              },
            },
          },
          mappings: {
            properties: {
              name: {
                type: 'text',
                analyzer: 'product_custom_analyzer',
                index_prefixes: {
                  min_chars: 1,
                  max_chars: 10,
                },
              },
              cateName: {
                type: 'text',
              },
              salePrice: {
                type: 'integer',
              },
              productPhoto: {
                type: 'text',
              },
              id: {
                type: 'keyword',
              },
            },
          },
        },
        {
          auth: {
            username: this.configService.get(
              'elasticSearch.ELASTICSEARCH_USERNAME',
            ),
            password: this.configService.get(
              'elasticSearch.ELASTICSEARCH_PASSWORD',
            ),
          },
        },
      );

      return true;
    } catch (err) {
      throw err;
    }
  }

  async indexProducts(): Promise<boolean> {
    try {
      const listProducts = await this.getAll();
      await this.settingIndex(this.index);
      await Promise.all(
        listProducts.map(async (product) => {
          const { CategoryId: cate, ...rest } = product;
          this.elasticsearchService.index({
            index: this.index,
            document: {
              ...rest,
              cateName: await cate.load('name'),
            },
          });
        }),
      );

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async clearAllIndex(): Promise<boolean> {
    try {
      await this.elasticsearchService.indices.delete({
        index: '_all',
      });

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  // Search

  async search({ search, limit, offset, min, max }: QueryDTO): Promise<any> {
    try {
      const rangePrice = this.rangePrice(min, max)
        ? [
            {
              range: {
                salePrice: this.rangePrice(min, max),
              },
            },
          ]
        : [];

      const { hits: results, suggest } = await this.elasticsearchService.search(
        {
          index: this.index,
          body: {
            from: offset,
            size: limit,
            query: {
              boosting: {
                positive: {
                  bool: {
                    must: [...this.query(search), ...rangePrice],
                  },
                },
                negative: {
                  bool: {
                    should: [
                      {
                        bool: {
                          must: [
                            {
                              match: {
                                cateName: 'Phụ kiện',
                              },
                            },
                            ...rangePrice,
                            ...this.query(search),
                          ],
                        },
                      },
                      {
                        bool: {
                          must: [
                            {
                              match: {
                                cateName: 'Work Setup',
                              },
                            },
                            ...rangePrice,
                            ...this.query(search),
                          ],
                        },
                      },
                    ],
                  },
                },
                negative_boost: 0.3,
              },
            },
            suggest: {
              suggestion: {
                text: search,
                term: {
                  field: 'name',
                  sort: 'frequency',
                  suggest_mode: 'always',
                },
              },
            },
          },
        },
      );

      const { hits: resultsRelated } = await this.elasticsearchService.search({
        index: this.index,
        body: {
          from: offset,
          size: limit,
          query: {
            more_like_this: {
              fields: ['name', 'cate'],
              like: search,
              min_term_freq: 1,
              max_query_terms: 12,
            },
          },
          suggest: {
            suggestion: {
              text: search,
              term: {
                field: 'name',
                sort: 'frequency',
                suggest_mode: 'always',
              },
            },
          },
        },
      });

      return {
        suggest,
        resultsRelated: resultsRelated.hits.map((p) => p._source),
        count: results.total['value'] || 0,
        rows: results.hits.map((p) => p._source),
      };
    } catch (err) {
      console.log(err);
      return { count: 0, rows: [] };
    }
  }

  async getAllIndex(): Promise<{ count: unknown | number; rows: unknown }> {
    try {
      const { hits: results } = await this.elasticsearchService.search({
        index: this.index,
        body: {
          query: {
            match_all: {},
          },
        },
      });

      return {
        count: results.total['value'] || 0,
        rows: results.hits.map((e) => e._source),
      };
    } catch (err) {
      console.log(err);
      return { count: 0, rows: [] };
    }
  }

  // Consistent

  async indexOne(product: ProductDTO): Promise<boolean> {
    try {
      const cateName = await (
        await this.getOneProduct(product.id)
      ).CategoryId.load('name');

      const { CategoryId, ...rest } = product;
      await this.elasticsearchService.index({
        index: this.index,
        document: {
          ...rest,
          cateName: cateName,
        },
      });

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async removeIndex(productId: string): Promise<boolean> {
    try {
      await this.elasticsearchService.deleteByQuery({
        index: this.index,
        body: {
          query: {
            match: {
              id: productId,
            },
          },
        },
      });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async updateIndex(product: ProductDTO): Promise<boolean> {
    try {
      const { id, CategoryId, ...rest } = product;
      const cateName = await (
        await this.getOneProduct(product.id)
      ).CategoryId.load('name');

      await this.elasticsearchService.updateByQuery({
        index: this.index,
        body: {
          query: {
            match: {
              id: id,
            },
          },
          script: {
            source: this.bodyUpdate(rest),
          },
        },
      });

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  // Ultil

  rangePrice(min: number, max: number) {
    try {
      if (!min && !max) return null;

      const range = [...arguments].reduce((newObj, current, index) => {
        const curValue = Number(current);
        if (curValue === 0 || !current) return newObj;

        Object.assign(newObj, {
          [index === 0 ? 'gte' : 'lte']: curValue,
        });

        return newObj;
      }, {});

      if (Object.keys(range).length <= 0) return null;
      return range;
    } catch (err) {
      return null;
    }
  }

  typeSearch(search: string) {
    return search.split(' ').length >= 3 ? 'cross_fields' : 'phrase_prefix';
  }

  bodyUpdate(product: any): string {
    return Object.entries(product).reduce((newScript: string, [key, value]) => {
      newScript += `ctx._source['${key}']='${value}'; `;
      return newScript;
    }, '');
  }

  query(search: string): any {
    return [
      {
        multi_match: {
          query: search || '',
          type: this.typeSearch(search),
          fields: ['name', 'cateName'],
          boost: 1,
        },
      },
      {
        match: {
          publish: true,
        },
      },
    ];
  }
}
