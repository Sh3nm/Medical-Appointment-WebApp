import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Appointment, Role, AppointmentStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
) {}

  // 1. CREATE APPOINTMENT (PASIEN)
  async create(patientId: number, data: CreateAppointmentDto): Promise<Appointment> {
    const { doctorId, appointmentDate } = data;

    // Konversi string ke Date
    const requestedDate = new Date(appointmentDate);

    // 1. Ambil data Pasien dan Dokter
    const [patient, doctor] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: patientId } }),
        this.prisma.doctor.findUnique({ where: { id: doctorId } }),
    ]);

    if (!patient) {
      throw new NotFoundException('Data pasien tidak ditemukan.');
    }
    if (!doctor) {
      throw new NotFoundException('Dokter tidak ditemukan.');
    }
    
    // 2. Validasi Ketersediaan dan Waktu
    
    // Validasi: Cek apakah tanggal appointment tidak di masa lalu
    if (requestedDate < new Date()) {
      throw new BadRequestException('Tanggal appointment tidak boleh di masa lalu.');
    }

    // Validasi: Cek ketersediaan waktu dokter
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        // Cek dalam rentang waktu yang sama (atau sesuaikan dengan kebutuhan jam kerja)
        date: requestedDate, 
        status: AppointmentStatus.PENDING, // Hanya cek appointment yang masih pending
      },
    });

    if (existingAppointment) {
      throw new BadRequestException(
        'Dokter sudah memiliki janji temu pada waktu tersebut. Silakan pilih waktu lain.',
      );
    }
    
    // 3. Buat Janji Temu
    const newAppointment = await this.prisma.appointment.create({
      data: {
        userId: patientId,
        doctorId,
        date: requestedDate, 
        status: AppointmentStatus.PENDING, 
      },
      include: {
        user: true,
        doctor: true,
      }
    });

    // 4. Kirim Konfirmasi Email (Setelah berhasil dibuat)
    await this.mailService.sendAppointmentConfirmation(
        patient,
        doctor,
        newAppointment
    );

    // 5. Kembalikan hasil
    return newAppointment;
  }
  
  // 2. GET APPOINTMENTS PASIEN (PASIEN)
  async getPatientAppointments(patientId: number): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { userId: patientId },
      include: { doctor: { select: { name: true, specialization: true } } },
      orderBy: { date: 'desc' },
    });
  }

  // 3. GET APPOINTMENTS DOKTER (DOKTER)
  async getDoctorAppointments(doctorId: number): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { doctorId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { date: 'asc' },
    });
  }

  // 4. UPDATE STATUS APPOINTMENT (DOKTER/ADMIN)
  async updateStatus(
    appointmentId: number,
    role: Role,
    updateData: UpdateStatusDto,
  ): Promise<Appointment> {
    
    if (role !== Role.DOCTOR && role !== Role.ADMIN) {
        throw new ForbiddenException('Hanya Dokter atau Admin yang dapat mengubah status janji temu.');
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Janji temu tidak ditemukan.');
    }

    if (appointment.status === AppointmentStatus.FINISHED || appointment.status === AppointmentStatus.CANCELLED) {
        throw new BadRequestException('Status janji temu tidak dapat diubah lagi.');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: updateData.status },
    });
  }

  // 5. CANCEL APPOINTMENT (PASIEN)
  async cancelAppointment(
    appointmentId: number,
    patientId: number,
  ): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Janji temu tidak ditemukan.');
    }

    // Pastikan appointment milik patient yang sedang login
    if (appointment.userId !== patientId) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk membatalkan janji temu ini.');
    }

    // Validasi: hanya bisa cancel jika status masih PENDING
    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Hanya janji temu dengan status PENDING yang dapat dibatalkan.');
    }

    // Validasi: harus lebih dari 2 jam sebelum jadwal appointment
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60); // Convert to hours

    if (hoursDiff <= 2) {
      throw new BadRequestException(
        'Janji temu tidak dapat dibatalkan. Harus lebih dari 2 jam sebelum jadwal appointment.',
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
    });
  }
}