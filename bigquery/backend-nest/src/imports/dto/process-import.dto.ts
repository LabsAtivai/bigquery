import { IsNotEmpty, IsObject } from 'class-validator';

export class ProcessImportDto {
  @IsObject()
  @IsNotEmpty()
  mapping: Record<string, string>;
}
