// src/common/testing/test-db-helper.ts

import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export async function clearDatabase(app: INestApplication): Promise<void> {
  const prisma: PrismaService = app.get(PrismaService);
  
  // MedicalRecord (anak dari Appointment, User)
  await prisma.medicalRecord.deleteMany(); 
  // Appointment (anak dari User, Doctor)
  await prisma.appointment.deleteMany();
  // Doctor dan User (induk)
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany(); 
}