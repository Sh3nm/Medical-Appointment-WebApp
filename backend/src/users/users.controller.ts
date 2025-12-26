import { Controller, Get, Patch, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../common/get-users.decorator';
import { UpdateUserDto } from './dto/update-user.dto'; // Akan dibuat

@Controller('users')
@UseGuards(JwtAuthGuard) // Lindungi semua endpoint di sini
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. GET PROFILE SAYA
  // Endpoint: GET /users/me
  @Get('me')
  async getProfile(@GetUser() user: { sub: number; role: string }) {
    // user.sub = ID pengguna dari JWT
    return this.usersService.findOne(user.sub, user.role);
  }

  // 2. UPDATE PROFILE SAYA
  // Endpoint: PATCH /users/me
  @Patch('me')
  async updateProfile(
    @GetUser() user: { sub: number; role: string },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.sub, user.role, updateUserDto);
  }

  // 3. DELETE PROFILE SAYA
  // Endpoint: DELETE /users/me
  @Delete('me')
  async removeSelf(@GetUser() user: { sub: number; role: string }) {
    return this.usersService.remove(user.sub, user.role);
  }
}