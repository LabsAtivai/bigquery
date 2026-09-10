import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nome_completo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  linkedin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  cargo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  pais?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  localizacao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  empresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  url_empresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  tamanho?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  pais_empresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  localizacao_empresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  estado_empresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  cidade_empresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  setor_empresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  client?: string;
}
