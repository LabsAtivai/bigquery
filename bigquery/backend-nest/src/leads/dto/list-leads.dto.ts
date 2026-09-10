import { applyDecorators } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

function OptionalStringArray() {
  return applyDecorators(
    IsOptional(),
    Transform(({ value }) => {
      if (value === undefined || value === null || value === '')
        return undefined;
      const arr = Array.isArray(value) ? value : [value];
      return arr.map((v) => String(v).trim()).filter(Boolean);
    }),
    IsArray(),
    IsString({ each: true }),
  );
}

export class ListLeadsDto {
  @OptionalStringArray()
  setor_empresa?: string[];

  @OptionalStringArray()
  estado_empresa?: string[];

  @OptionalStringArray()
  cidade_empresa?: string[];

  @OptionalStringArray()
  pais_empresa?: string[];

  @OptionalStringArray()
  tamanho?: string[];

  @OptionalStringArray()
  cargo?: string[];

  @OptionalStringArray()
  client?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
