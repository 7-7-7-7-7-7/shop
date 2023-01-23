import { BadRequestException, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FilesService } from './files.service';
import { FileInterceptor } from "@nestjs/platform-express";
import { fileFilter } from "./helpers/file-filter";
import { diskStorage } from "multer";
import { fileNamer } from "./helpers/file-namer";
import { Response } from "express";
import { ConfigService } from "@nestjs/config";

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

  @Get('product/:imageName')
  findProductImage(
    @Res() res: Response,
    @Param('imageName') imageName: string
  ){
    const path = this.filesService.getStaticProductImage(imageName);
    res.sendFile(path);
  }

  @Post('product')
  @UseInterceptors(FileInterceptor('file',
    {
      fileFilter: fileFilter,
      storage: diskStorage({
        destination: './static/products',
        filename: fileNamer
      }),
    }))
  uploadProductFile(@UploadedFile() file: Express.Multer.File) {
    if(!file) {
      throw new BadRequestException('Make sure that the file is an image');
    }

    return {
      secure_url: `${this.configService.get('API_URL')}/files/product/${file.filename}`
    }
  }
}
