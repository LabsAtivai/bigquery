import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

export function parseObjectId(id: string, entityName = 'recurso'): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new BadRequestException(`Id de ${entityName} inválido`);
  }
  return new ObjectId(id);
}
