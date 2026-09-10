import { Test } from '@nestjs/testing';
import { BadRequestException, HttpException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { MongoService } from '../mongo/mongo.service';
import { CampaignsService } from '../campaigns/campaigns.service';

function makeFakeCollection() {
  const cursor = {
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
  };

  return {
    countDocuments: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockReturnValue(cursor),
    aggregate: jest
      .fn()
      .mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
  };
}

describe('LeadsService', () => {
  let service: LeadsService;
  let collection: ReturnType<typeof makeFakeCollection>;
  let db: any;

  beforeEach(async () => {
    collection = makeFakeCollection();
    db = { collection: jest.fn().mockReturnValue(collection) };

    const module = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: MongoService, useValue: { getDb: () => db } },
        { provide: CampaignsService, useValue: { createCampaign: jest.fn() } },
      ],
    }).compile();

    service = module.get(LeadsService);
  });

  describe('findAll', () => {
    it('escapa metacaracteres de regex em filtros de valor único', async () => {
      await service.findAll({ cargo: '(a+)+$' });

      const filterUsed = collection.find.mock.calls[0][0];
      expect(filterUsed.cargo.$regex).toBe('\\(a\\+\\)\\+\\$');
    });

    it('usa $in quando há múltiplos valores para o mesmo campo', async () => {
      await service.findAll({ cargo: ['CEO', 'CTO'] });

      const filterUsed = collection.find.mock.calls[0][0];
      expect(filterUsed.cargo).toEqual({ $in: ['CEO', 'CTO'] });
    });

    it('aplica paginação com defaults quando page/limit não são enviados', async () => {
      collection.countDocuments.mockResolvedValue(125);

      const result = await service.findAll({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.totalPages).toBe(3);
    });

    it('ignora page/limit inválidos e usa o fallback', async () => {
      const result = await service.findAll({ page: 'abc', limit: -5 });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });
  });

  describe('update', () => {
    const validId = '507f1f77bcf86cd799439011';

    it('rejeita id inválido antes de tocar no banco', async () => {
      await expect(
        service.update('id-invalido', { nome: 'X' }),
      ).rejects.toThrow(BadRequestException);
      expect(db.collection).not.toHaveBeenCalled();
    });

    it('rejeita quando não há nenhum campo para atualizar', async () => {
      await expect(
        service.update(validId, { nome: undefined }),
      ).rejects.toThrow(HttpException);
    });

    it('lança NOT_FOUND quando o lead não existe', async () => {
      (collection as any).findOneAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(service.update(validId, { nome: 'X' })).rejects.toThrow(
        HttpException,
      );
    });

    it('atualiza e retorna o documento quando o lead existe', async () => {
      (collection as any).findOneAndUpdate = jest
        .fn()
        .mockResolvedValue({ _id: validId, nome: 'X' });

      const result = await service.update(validId, { nome: 'X' });

      expect(result).toEqual({ _id: validId, nome: 'X' });
    });
  });

  describe('remove', () => {
    const validId = '507f1f77bcf86cd799439011';

    it('rejeita id inválido antes de tocar no banco', async () => {
      await expect(service.remove('id-invalido')).rejects.toThrow(
        BadRequestException,
      );
      expect(db.collection).not.toHaveBeenCalled();
    });

    it('lança NOT_FOUND quando nada é deletado', async () => {
      (collection as any).deleteOne = jest
        .fn()
        .mockResolvedValue({ deletedCount: 0 });

      await expect(service.remove(validId)).rejects.toThrow(HttpException);
    });

    it('retorna sucesso quando o lead é deletado', async () => {
      (collection as any).deleteOne = jest
        .fn()
        .mockResolvedValue({ deletedCount: 1 });

      const result = await service.remove(validId);

      expect(result).toEqual({ deleted: true });
    });
  });
});
