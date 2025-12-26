import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { mailerConfig } from '../config/mail.config'; // ⬅️ Import Konfigurasi

@Global() // Agar service dapat diakses di seluruh modul (Appointments, Auth, dll.)
@Module({
  imports: [
    // Daftarkan konfigurasi Mailer
    MailerModule.forRoot(mailerConfig),
  ],
  providers: [MailService],
  exports: [MailService], // Wajib diexport agar bisa digunakan
})
export class MailModule {}