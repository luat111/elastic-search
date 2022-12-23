import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { Product } from 'src/entities/products';
import { ElasticSearchController } from './elasticsearch.controller';
import { ElasticSearchService } from './elasticsearch.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Product]),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        headers: { 'content-type': 'application/json' },
        node: configService.get('ELASTICSEARCH_NODE'),
        auth: {
          username: configService.get('ELASTICSEARCH_USERNAME'),
          password: configService.get('ELASTICSEARCH_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ElasticSearchController],
  providers: [ElasticSearchService],
})
export class ElasticSearchModule {}
