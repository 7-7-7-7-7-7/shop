import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { PaginationDto } from "../common/dtos/pagination.dto";
import { validate as IsUUID } from 'uuid';
import { Product, ProductImage } from "./entities";


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails} = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        images: images.map(image => this.productImageRepository.create({ url: image }))
      });
      await this.productRepository.save(product);

      return { ...product, images };
    } catch(error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0} = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      }
    });

    return products.map(product => ({
      ...product,
      images: product.images.map(image => {
        image.url
      })
    }))
  }

  async findOne(term: string) {
    let product: Product;

    if(IsUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
      return product;
    } {
      term = term.toLowerCase()
        .replaceAll(' ', '_')
        .replaceAll("'", '');
      const queryBuilder = await this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder.where(`UPPER(title) =:title or slug =:slug`, {
        title: term.toUpperCase(),
        slug: term,
      })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }

    if(!product) {
      throw new NotFoundException(`Product with term "${term}" does not exists in db!`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const { images = [], ...toUpdate } = updateProductDto;
      const product = await this.productRepository.preload({
        id,
        ...toUpdate
      });

      // create queryRunner
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        if(images) {
          await queryRunner.manager.delete(ProductImage, { product: { id } });
          product.images = images.map(
            image => this.productImageRepository.create({ url: image })
          )
        } else {
          product.images = await this.productImageRepository.findBy({})
        }
        await queryRunner.manager.save(product);
        await queryRunner.commitTransaction();
        await queryRunner.release();
      } catch(error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        this.handleDBExceptions(error);
      }

      if(!product) {
        throw new NotFoundException(`Product with #${id} does not exists in db!`);
      }

      return product;
    } catch(error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const { affected } = await this.productRepository.delete(id);
    if(affected == 0) {
      throw new NotFoundException(`Product with id #${id} does not exists in db!`);
    }
  }

  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map(img => img.url),
    }
  }

  private handleDBExceptions(error: any) {
    this.logger.error(error);
    if(error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    throw new InternalServerErrorException('Error trying to insert product in db!')
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query.delete().where({}).execute();
    } catch(error) {
      this.handleDBExceptions(error);
    }
  }
}
