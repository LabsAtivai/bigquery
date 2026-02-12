import { Controller, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post(':id/process')
  async process(@Param('id') id: string, @Body() body?: any) {
    if (!body) {
      throw new BadRequestException('Body não enviado');
    }

    if (!body.mapping) {
      throw new BadRequestException('Mapping não enviado no body');
    }

    return this.importsService.process(id, body.mapping);
  }
}
