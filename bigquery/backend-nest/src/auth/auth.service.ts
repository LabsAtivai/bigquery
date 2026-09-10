import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MongoService } from '../mongo/mongo.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly mongoService: MongoService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const db = this.mongoService.getDb();
    const normalizedEmail = email.toLowerCase().trim();

    const user = await db
      .collection('users')
      .findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const payload = { sub: String(user._id), email: user.email as string };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { email: user.email as string },
    };
  }
}
