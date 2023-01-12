import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from "./entities/product.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaginationDto } from "../common/dtos/pagination.dto";
import { validate as IsUUID } from 'uuid';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto)
      await this.productRepository.save(product);

      return product;
    } catch(error) {
      this.handleDBExceptions(error);
    }
  }

  // Todo: Paginar
  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0} = paginationDto;
    return this.productRepository.find({
      take: limit,
      skip: offset,
    });
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
      const queryBuilder = await this.productRepository.createQueryBuilder();
      product = await queryBuilder.where(`UPPER(title) =:title or slug =:slug`, {
        title: term.toUpperCase(),
        slug: term,
      }).getOne();
    }

    if(!product) {
      throw new NotFoundException(`Product with term "${term}" does not exists in db!`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.productRepository.preload({
        id: id,
        ...updateProductDto,
      });

      if(!product) {
        throw new NotFoundException(`Product with #${id} does not exists in db!`);
      }

      return this.productRepository.save(product);
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

  private handleDBExceptions(error: any) {
    this.logger.error(error);
    if(error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    throw new InternalServerErrorException('Error trying to insert product in db!')
  }
}
