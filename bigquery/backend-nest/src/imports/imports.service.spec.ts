import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import axios from 'axios';
import { ImportsService } from './imports.service';
import { MongoService } from '../mongo/mongo.service';

jest.mock('axios');
const mockedPost = axios.post as jest.MockedFunction<typeof axios.post>;

describe('ImportsService', () => {
  let service: ImportsService;
  let collection: any;
  let db: any;

  const validId = '507f1f77bcf86cd799439011';

  beforeEach(async () => {
    collection = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'abc123' }),
      findOne: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({}),
    };
    db = { collection: jest.fn().mockReturnValue(collection) };

    const module = await Test.createTestingModule({
      providers: [
        ImportsService,
        { provide: MongoService, useValue: { getDb: () => db } },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, def?: any) => def },
        },
      ],
    }).compile();

    service = module.get(ImportsService);
    mockedPost.mockReset();
  });

  describe('create', () => {
    it('grava o import com status "uploaded"', async () => {
      await service.create('/tmp/file.csv');

      expect(collection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          file_path: '/tmp/file.csv',
          status: 'uploaded',
        }),
      );
    });
  });

  describe('process', () => {
    it('marca como "processed" quando o ETL responde com sucesso', async () => {
      collection.findOne.mockResolvedValue({
        _id: validId,
        file_path: '/tmp/x.csv',
      });
      mockedPost.mockResolvedValue({ data: { imported: 10 } } as any);

      const result = await service.process(validId, { email: 'E-mail' });

      expect(result).toEqual({ imported: 10 });
      expect(collection.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          $set: expect.objectContaining({ status: 'processed' }),
        }),
      );
    });

    it('marca como "error" (em vez de travar em "uploaded") quando o ETL falha', async () => {
      collection.findOne.mockResolvedValue({
        _id: validId,
        file_path: '/tmp/x.csv',
      });
      mockedPost.mockRejectedValue(new Error('timeout'));

      await expect(service.process(validId, {})).rejects.toThrow(HttpException);

      expect(collection.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          $set: expect.objectContaining({ status: 'error' }),
        }),
      );
    });

    it('rejeita id de import inválido antes de consultar o banco', async () => {
      await expect(service.process('id-invalido', {})).rejects.toThrow();
      expect(db.collection).not.toHaveBeenCalled();
    });
  });
});
