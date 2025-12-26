import { Controller, Post, Get, Patch, Body, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser, JwtUser } from '../common/get-users.decorator';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Role } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

@Controller('appointments')
@UseGuards(JwtAuthGuard) // Semua endpoint dilindungi oleh JWT
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // 1. CREATE APPOINTMENT (PASIEN)
  // Endpoint: POST /appointments
  @Post()
  @Roles(Role.PATIENT) // Hanya Pasien yang dapat membuat janji
  @UseGuards(RolesGuard) 
  create(@GetUser() user: JwtUser, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(user.sub, createAppointmentDto);
    // TODO: Integrasi MailService di sini
  }

  // 2. GET APPOINTMENTS PASIEN (PASIEN)
  // Endpoint: GET /appointments/me
  @Get('me')
  @Roles(Role.PATIENT)
  @UseGuards(RolesGuard)
  getPatientAppointments(@GetUser() user: JwtUser) {
    return this.appointmentsService.getPatientAppointments(user.sub);
  }

  // 3. GET APPOINTMENTS DOKTER (DOKTER)
  // Endpoint: GET /appointments/doctor/me
  @Get('doctor/me')
  @Roles(Role.DOCTOR, Role.ADMIN) // Dokter atau Admin dapat melihat daftar janji Dokter
  @UseGuards(RolesGuard)
  getDoctorAppointments(@GetUser() user: JwtUser) {
    // Hanya Dokter yang ID-nya digunakan untuk query
    if (user.role === Role.DOCTOR) {
        return this.appointmentsService.getDoctorAppointments(user.sub);
    } 
    // Jika ADMIN, Admin mungkin perlu endpoint lain (GET ALL)
    throw new ForbiddenException('Admin harus menggunakan endpoint global jika perlu.');
  }

  // 4. UPDATE STATUS APPOINTMENT (DOKTER/ADMIN)
  // Endpoint: PATCH /appointments/:id/status
  @Patch(':id/status')
  @Roles(Role.DOCTOR, Role.ADMIN) // Hanya Dokter atau Admin yang dapat mengubah status
  @UseGuards(RolesGuard)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtUser,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, user.role, updateStatusDto);
  }

  // 5. CANCEL APPOINTMENT (PASIEN)
  // Endpoint: PATCH /appointments/:id/cancel
  @Patch(':id/cancel')
  @Roles(Role.PATIENT)
  @UseGuards(RolesGuard)
  cancelAppointment(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtUser,
  ) {
    return this.appointmentsService.cancelAppointment(id, user.sub);
  }
}