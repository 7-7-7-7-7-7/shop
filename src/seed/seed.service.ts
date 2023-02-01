import { Injectable } from '@nestjs/common';
import { ProductsService } from "../products/products.service";
import { initialData } from "./data/seed";
import { User } from "../auth/entities/user.entity";

@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  async runSeed(user: User) {
    await this.productsService.deleteAllProducts();
    await this.insertNewProducts(user);
    return 'SEED EXECUTED';
  }

  private async insertNewProducts(user: User) {
    const products = initialData.products;
    const insertPromises = [];
    products.forEach((product) => {
      insertPromises.push(this.productsService.create(product, user));
    })

    await Promise.all(insertPromises);
    return true;
  }
}
