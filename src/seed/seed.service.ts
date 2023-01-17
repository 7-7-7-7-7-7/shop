import { Injectable } from '@nestjs/common';
import { ProductsService } from "../products/products.service";
import { initialData } from "./data/seed";

@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  async runSeed() {
    await this.productsService.deleteAllProducts();
    await this.insertNewProducts();
    return 'SEED EXECUTED';
  }

  private async insertNewProducts() {
    const products = initialData.products;
    const insertPromises = [];
    products.forEach((product) => {
      insertPromises.push(this.productsService.create(product));
    })

    await Promise.all(insertPromises);
    return true;
  }
}
