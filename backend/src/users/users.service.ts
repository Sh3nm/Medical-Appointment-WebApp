import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs'; // ⬅️ Tambahkan import ini untuk hashing

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  private async findUserByIdAndRole(id: number, role: string) {
    if (role === 'PATIENT') {
      return this.prisma.user.findUnique({ where: { id } });
    } else if (role === 'DOCTOR') {
      return this.prisma.doctor.findUnique({ where: { id } });
    }
    return null;
  }
  
  // 1. GET DATA USER YANG SEDANG LOGIN (findOne) - (Tidak Berubah)
  async findOne(id: number, role: string) {
      const user = await this.findUserByIdAndRole(id, role);
      
      if (!user) {
          throw new NotFoundException('User profile not found.');
      }
      
      const { password, refreshToken, ...safeUser } = user; 
      return safeUser;
  }
  
  // 2. UPDATE PROFILE DAN PASSWORD (Method Utama)
  async update(id: number, role: string, updateData: UpdateUserDto) {
    const { name, oldPassword, newPassword } = updateData;
    let dataToUpdate: any = {};
    
    const user = await this.findUserByIdAndRole(id, role);

    if (!user) {
        throw new NotFoundException('User profile not found.');
    }

    // A. LOGIC UPDATE NAMA (Jika ada)
    if (name) {
      dataToUpdate.name = name;
    }

    // B. LOGIC UPDATE PASSWORD (Jika ada newPassword)
    if (newPassword) {
      if (!oldPassword) {
        throw new BadRequestException('Password lama wajib diisi untuk mengubah password.');
      }
      
      // 1. Verifikasi Password Lama
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Password lama tidak valid.');
      }

      // 2. Hash Password Baru
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      dataToUpdate.password = hashedNewPassword;
    }
    
    // Pastikan ada sesuatu yang diupdate
    if (Object.keys(dataToUpdate).length === 0) {
        return user; // Tidak ada perubahan
    }

    // C. EKSEKUSI UPDATE BERDASARKAN ROLE
    if (role === 'PATIENT' || role === 'ADMIN') {
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });
        const { password, refreshToken, ...safeUser } = updatedUser; 
        return safeUser;
    } else if (role === 'DOCTOR') {
         const updatedDoctor = await this.prisma.doctor.update({
             where: { id },
             data: dataToUpdate,
         });
         const { password, refreshToken, ...safeUser } = updatedDoctor; 
         return safeUser;
    }
    
    throw new NotFoundException('Invalid user role.');
  }

  async remove(userId: number, role: string): Promise<{ message: string }> {
    // Check if user exists based on role
    const user = await this.findUserByIdAndRole(userId, role);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Delete based on role
    if (role === 'PATIENT' || role === 'ADMIN') {
      await this.prisma.user.delete({
        where: { id: userId },
      });
    } else if (role === 'DOCTOR') {
      await this.prisma.doctor.delete({
        where: { id: userId },
      });
    } else {
      throw new BadRequestException('Invalid role.');
    }

    return { message: 'Account deleted successfully.' };
  }
}