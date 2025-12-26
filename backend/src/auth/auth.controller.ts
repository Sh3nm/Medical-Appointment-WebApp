import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { handlePrismaError } from '../common/prisma-error.handler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
// update ini
import { RegisterUserDto } from './dto/register-user.dto'; 
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayloadDto } from './dto/jwt-payload';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-patient')
  async registerPatient(@Body() registerDto: RegisterUserDto) {
    try {
      return await this.authService.registerPatient(registerDto);
    } catch (error) {
      handlePrismaError(error, 'register patient');
    }
  }

  @Post('register-doctor')
  async registerDoctor(@Body() registerDto: RegisterDoctorDto) {
    try {
      return await this.authService.registerDoctor(registerDto);
    } catch (error) {
      handlePrismaError(error, 'register doctor');
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      handlePrismaError(error, 'login user');
    }
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      return await this.authService.refreshToken(refreshTokenDto);
    } catch (error) {
      handlePrismaError(error, 'refresh token');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: { user: JwtPayloadDto }) {
    try {
      return await this.authService.logout(req.user.sub, req.user.role);
    } catch (error) {
      handlePrismaError(error, 'logout user');
    }
  }
}