import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { Role } from '@prisma/client';
import * as fs from 'fs'; 

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async create(
    patientId: number,
    file: Express.Multer.File,
    dto: CreateMedicalRecordDto,
  ) {
    const { notes } = dto;
    const appointmentId = Number(dto.appointmentId);
    if (!Number.isFinite(appointmentId)) {
      fs.unlinkSync(file.path);
      throw new ForbiddenException('appointmentId tidak valid.');
    }

    // A. Verifikasi Janji Temu dan Otorisasi (Harus terkait dengan Dokter ini)
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { doctorId: true, userId: true, id: true, status: true }
    });

    if (!appointment) {
      fs.unlinkSync(file.path); 
      throw new NotFoundException('Janji temu tidak ditemukan.');
    }

    if (appointment.userId !== patientId) {
        fs.unlinkSync(file.path); 
        throw new ForbiddenException('Anda tidak berhak mengunggah rekam medis untuk janji temu ini.');
    }
    
    // B. Simpan Metadata ke Database
    return this.prisma.medicalRecord.create({
      data: {
        appointmentId,
        userId: patientId,
        fileName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        noteContent: notes,
      },
    });
  }

  async findOne(recordId: number, userId: number, role: Role) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Rekam medis tidak ditemukan.');
    }
    
    const isOwner = record.userId === userId;

    if (!isOwner) {
      throw new ForbiddenException('Anda tidak memiliki akses ke rekam medis ini.');
    }

    const { filePath, ...safeRecord } = record;
    return safeRecord;
  }

  async findByAppointmentId(appointmentId: number, userId: number, role: Role) {
    // Cek dulu appointment itu ada dan milik user ini
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { userId: true, doctorId: true }
    });

    if (!appointment) {
      throw new NotFoundException('Janji temu tidak ditemukan.');
    }

    // Pasien hanya bisa lihat rekam medis sendiri
    if (role === 'PATIENT' && appointment.userId !== userId) {
      throw new ForbiddenException('Anda tidak berhak melihat rekam medis ini.');
    }

    // Dokter bisa lihat rekam medis pasiennya
    if (role === 'DOCTOR' && appointment.doctorId !== userId) {
      throw new ForbiddenException('Anda tidak berhak melihat rekam medis ini.');
    }

    const record = await this.prisma.medicalRecord.findFirst({
      where: { appointmentId },
    });

    if (!record) {
      return null; 
    }

    const { filePath, ...safeRecord } = record;
    return safeRecord;
  }

  async getFileUrl(recordId: number, userId: number, role: Role) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        appointment: {
          select: { userId: true, doctorId: true }
        }
      }
    });

    if (!record) {
      throw new NotFoundException('Rekam medis tidak ditemukan.');
    }

    // Verifikasi akses
    const isOwner = record.userId === userId;
    const isDoctor = role === 'DOCTOR' && record.appointment.doctorId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isOwner && !isDoctor && !isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki akses ke file ini.');
    }

    // Return file path and metadata
    return {
      filePath: record.filePath,
      fileName: record.fileName,
      mimeType: record.mimeType,
    };
  }
}