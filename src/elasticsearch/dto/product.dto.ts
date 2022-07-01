import { Category } from 'src/entities/categories';

export class ProductDTO {
  id: string;
  name?: string;
  uri?: string;
  salePrice?: number;
  productPhoto?: string;
  publish: boolean;
  CategoryId?: Category;
}

export class QueryDTO {
  search: string;
  limit: number;
  offset: number;
  min: number;
  max: number;
}
