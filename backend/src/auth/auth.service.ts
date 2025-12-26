import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto'; // DTO Pasien
import { RegisterDoctorDto } from './dto/register-doctor.dto'; // DTO Dokter
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Menggabungkan pencarian di tabel User dan Doctor berdasarkan email
  private async findUserByEmail(email: string): Promise<any> {
      // 1. Cari di tabel User (Patient)
      let user: any = await this.prisma.user.findUnique({ where: { email } });
      
      // 2. Jika tidak ditemukan, cari di tabel Doctor
      if (!user) {
          user = await this.prisma.doctor.findUnique({ where: { email } });
      }

      // Mengembalikan objek yang ditemukan (bisa Patient atau Doctor)
      return user; 
  }

  private generateTokens(payload: { sub:number, email:string, role: Role }) {
    const accessToken = this.jwtService.sign(payload, {
        expiresIn: '15m',
    });

    const refreshPayload = {
        ...payload,
        jti: `${payload.sub}-${Date.now()}-${Math.random()}`,
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
        expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
  
  private async updateRefreshToken(id: number, role: Role, refreshToken: string | null) {
      const hashedRefreshToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;

      if (role === 'PATIENT' || role === 'ADMIN') { // kalau jadi tambahin admin
          await this.prisma.user.update({
              where: { id: id },
              data: { refreshToken: hashedRefreshToken },
          });
      } else if (role === 'DOCTOR') {
          await this.prisma.doctor.update({
              where: { id: id },
              data: { refreshToken: hashedRefreshToken },
          });
      }
  }

  // 1. REGISTER PASIEN (ROLE: PATIENT)
  async registerPatient(registerDto: RegisterUserDto) {
      const { email, password, name } = registerDto;
      
      if (await this.findUserByEmail(email)) {
          throw new ForbiddenException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
          data: { email, name, password: hashedPassword, role: 'PATIENT' },
      });

      const payload = { sub: user.id, email: user.email, role: user.role };
      const { accessToken, refreshToken } = this.generateTokens(payload);
      
      await this.updateRefreshToken(user.id, user.role, refreshToken);

      return { access_token: accessToken, refresh_token: refreshToken, user };
  }

  // 2. REGISTER DOKTER (ROLE: DOCTOR)
  async registerDoctor(registerDto: RegisterDoctorDto) {
      const { email, password, name, specialization } = registerDto;

      if (await this.findUserByEmail(email)) {
          throw new ForbiddenException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const doctor = await this.prisma.doctor.create({
          data: { email, name, password: hashedPassword, specialization, role: 'DOCTOR' },
      });

      const payload = { sub: doctor.id, email: doctor.email, role: doctor.role };
      const { accessToken, refreshToken } = this.generateTokens(payload);
      
      await this.updateRefreshToken(doctor.id, doctor.role, refreshToken);

      return { access_token: accessToken, refresh_token: refreshToken, user: doctor };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto; // Menggunakan email dari DTO
    
    // Mencari user di kedua tabel
    const user = await this.findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken } = this.generateTokens(payload);
    
    await this.updateRefreshToken(user.id, user.role, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken) as {
        sub: number;
        email: string;
        role: Role;
        jti: string;
      };

      // Mencari user di database (Patient atau Doctor)
      const user = await this.findUserByEmail(payload.email); 

      if (!user || user.id !== payload.sub || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Membandingkan token yang dikirim dengan hash di database
      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const { accessToken, refreshToken: newRefreshToken } =
        this.generateTokens(newPayload);
        
      await this.updateRefreshToken(user.id, user.role, newRefreshToken);

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number, role: Role) {
    await this.updateRefreshToken(userId, role, null);

    return { message: 'Logged out successfully' };
  }
}


