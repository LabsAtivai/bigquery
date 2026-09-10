import {
  Controller,
  Post,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { ImportsService } from './imports.service';
import { ProcessImportDto } from './dto/process-import.dto';

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'imports');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          cb(
            null,
            `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
          );
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (
          !ALLOWED_EXTENSIONS.includes(ext) ||
          !ALLOWED_MIME_TYPES.includes(file.mimetype)
        ) {
          cb(
            new BadRequestException('Arquivo deve ser .csv, .xls ou .xlsx'),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');

    const importId = await this.importsService.create(file.path);
    return { import_id: importId };
  }

  @Post(':id/process')
  async process(@Param('id') id: string, @Body() body: ProcessImportDto) {
    return this.importsService.process(id, body.mapping);
  }
}
