import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { MongoService } from '../mongo/mongo.service';

describe('AuthService', () => {
  let service: AuthService;
  let collection: any;
  let db: any;

  beforeEach(async () => {
    collection = { findOne: jest.fn() };
    db = { collection: jest.fn().mockReturnValue(collection) };

    const jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: MongoService, useValue: { getDb: () => db } },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('retorna um token e os dados do usuário quando a senha está correta', async () => {
    const passwordHash = await bcrypt.hash('senha-certa', 10);
    collection.findOne.mockResolvedValue({
      _id: '1',
      email: 'a@b.com',
      passwordHash,
    });

    const result = await service.login('a@b.com', 'senha-certa');

    expect(result.access_token).toEqual(expect.any(String));
    expect(result.user).toEqual({ email: 'a@b.com' });
  });

  it('rejeita quando a senha está errada', async () => {
    const passwordHash = await bcrypt.hash('senha-certa', 10);
    collection.findOne.mockResolvedValue({
      _id: '1',
      email: 'a@b.com',
      passwordHash,
    });

    await expect(service.login('a@b.com', 'senha-errada')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita quando o usuário não existe', async () => {
    collection.findOne.mockResolvedValue(null);

    await expect(service.login('ninguem@b.com', 'qualquer')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('normaliza o e-mail (case/espacos) antes de buscar o usuário', async () => {
    const passwordHash = await bcrypt.hash('senha-certa', 10);
    collection.findOne.mockResolvedValue({
      _id: '1',
      email: 'a@b.com',
      passwordHash,
    });

    await service.login('  A@B.com  ', 'senha-certa');

    expect(collection.findOne).toHaveBeenCalledWith({ email: 'a@b.com' });
  });
});
