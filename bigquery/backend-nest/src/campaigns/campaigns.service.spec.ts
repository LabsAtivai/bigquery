import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { MongoService } from '../mongo/mongo.service';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let db: any;

  beforeEach(async () => {
    db = { collection: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: MongoService, useValue: { getDb: () => db } },
      ],
    }).compile();

    service = module.get(CampaignsService);
  });

  describe('export com id inválido', () => {
    it('rejeita com BadRequestException antes de tocar no banco (CSV)', async () => {
      const res: any = { setHeader: jest.fn(), headersSent: false };

      await expect(
        service.exportCampaignCSV('id-invalido', res),
      ).rejects.toThrow(BadRequestException);
      expect(db.collection).not.toHaveBeenCalled();
    });

    it('rejeita com BadRequestException antes de tocar no banco (XLSX)', async () => {
      const res: any = { setHeader: jest.fn(), headersSent: false };

      await expect(
        service.exportCampaignXLSX('id-invalido', res),
      ).rejects.toThrow(BadRequestException);
      expect(db.collection).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('escapa metacaracteres de regex nos filtros de busca', async () => {
      const cursor = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      };
      const collection = {
        find: jest.fn().mockReturnValue(cursor),
        countDocuments: jest.fn().mockResolvedValue(0),
      };
      db.collection.mockReturnValue(collection);

      await service.list({ name: '(a+)+$' });

      const filterUsed = collection.find.mock.calls[0][0];
      expect(filterUsed.name.$regex).toBe('\\(a\\+\\)\\+\\$');
    });

    it('pagina com defaults quando page/limit não são enviados', async () => {
      const cursor = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      };
      const collection = {
        find: jest.fn().mockReturnValue(cursor),
        countDocuments: jest.fn().mockResolvedValue(120),
      };
      db.collection.mockReturnValue(collection);

      const result = await service.list({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('remove', () => {
    it('rejeita id inválido antes de tocar no banco', async () => {
      await expect(service.remove('id-invalido')).rejects.toThrow(
        BadRequestException,
      );
      expect(db.collection).not.toHaveBeenCalled();
    });
  });
});
