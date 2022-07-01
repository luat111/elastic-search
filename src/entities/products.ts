import { Entity, IdentifiedReference, ManyToOne, PrimaryKey, Property, Reference } from '@mikro-orm/core';
import { Category } from './categories';

@Entity({ tableName: 'Products' })
export class Product {
  
  constructor(CategoryId: Category) {
    this.CategoryId = Reference.create(CategoryId);
  }
  
  @PrimaryKey()
  id: string;
  
  @Property()
  name: string;
  
  @Property()
  uri: string;
  
  @Property()
  salePrice: number;
  
  @Property()
  productPhoto: string;
  
  @Property()
  publish: boolean;
  
  @ManyToOne(() => Category, { wrappedReference: true })
  CategoryId: IdentifiedReference<Category>;
  
}
