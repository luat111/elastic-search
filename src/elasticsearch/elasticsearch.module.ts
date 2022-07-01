import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { Product } from 'src/entities/products';
import { ElascticSearchController } from './elasticsearch.controller';
import { ElascticSearchService } from './elasticsearch.service';

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
  controllers: [ElascticSearchController],
  providers: [ElascticSearchService],
})
export class ElascticSearchModule {}
