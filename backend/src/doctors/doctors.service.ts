import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  // 1. LIST SEMUA DOKTER (Untuk Pasien Browsing)
  async findAll() {
    const doctors = await this.prisma.doctor.findMany({
        select: {
            id: true,
            name: true,
            specialization: true,
            email: true,
            role: true,
        }
    });
    return doctors;
  }

  // 2. GET DETAIL DOKTER BERDASARKAN ID
  async findOne(id: number) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      select: {
          id: true,
          name: true,
          specialization: true,
          email: true,
          role: true,
      }
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found.`);
    }
    return doctor;
  }

  // 3. UPDATE PROFILE DOKTER (Digunakan oleh Admin atau Dokter itu sendiri)
  async update(id: number, updateData: UpdateDoctorDto) {
    const updatedDoctor = await this.prisma.doctor.update({
      where: { id },
      data: updateData,
    });
    
    const { password, refreshToken, ...safeDoctor } = updatedDoctor; 
    return safeDoctor;
  }
}