import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User, Appointment, Doctor } from '@prisma/client'; 

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  
  constructor(private mailerService: MailerService) {}

  // Method untuk Konfirmasi Janji Temu
  async sendAppointmentConfirmation(
    user: User, 
    doctor: Doctor, 
    appointment: Appointment,
  ) {
    // Format tanggal untuk template
    const formattedDate = appointment.date.toLocaleString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    try {
        await this.mailerService.sendMail({
          to: user.email, // Email penerima (Pasien)
          subject: `Konfirmasi Janji Temu Anda dengan Dr. ${doctor.name}`,
          template: './appointment-confirm', // Nama file template (tanpa .pug)
          context: {
            patientName: user.name,
            doctorName: doctor.name,
            specialization: doctor.specialization,
            appointmentId: appointment.id,
            date: formattedDate,
          },
        });
        this.logger.log(`Email konfirmasi berhasil dikirim ke ${user.email}`);
    } catch (error) {
        this.logger.error(`Gagal mengirim email ke ${user.email}: ${error.message}`);
    }
  }
}