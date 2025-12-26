import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { RecordsModule } from './records/records.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [AuthModule, UsersModule, DoctorsModule, AppointmentsModule, RecordsModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
