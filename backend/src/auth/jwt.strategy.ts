import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PrismaService } from '../prisma.service';
import { JwtPayloadDto } from './dto/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const payloadDto = plainToClass(JwtPayloadDto, payload);
    const errors = await validate(payloadDto);

    if (errors.length > 0) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Cek akun di tabel sesuai role (user untuk PATIENT/ADMIN, doctor untuk DOCTOR)
    let account: { id: number; email: string; role: string } | null = null;

    if (payloadDto.role === 'DOCTOR') {
      account = await this.prisma.doctor.findFirst({
        where: {
          id: payloadDto.sub,
          email: payloadDto.email,
          role: payloadDto.role,
        },
      });
    } else {
      account = await this.prisma.user.findFirst({
        where: { 
          id: payloadDto.sub,
          email: payloadDto.email,
          role: payloadDto.role,
        },
      });
    }

    if (!account) {
      throw new UnauthorizedException();
    }

    return { 
      sub: account.id, 
      email: account.email, 
      role: payloadDto.role 
    };
  }
}
