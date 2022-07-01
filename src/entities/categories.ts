import { Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Product } from './products';

@Entity({ tableName: 'Categories' })
export class Category {
  @PrimaryKey()
  id: string;

  @Property()
  name: string;

  @Property()
  uri: string;

  @OneToMany(() => Product, (product: Product) => product.CategoryId)
  products: Product[];
}
