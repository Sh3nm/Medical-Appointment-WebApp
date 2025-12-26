import { Controller, Post, Get, Body, UseInterceptors, UploadedFile, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecordsService } from './records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { GetUser, JwtUser } from '../common/get-users.decorator';
import { Role } from '@prisma/client';
import { multerOptions } from '../config/multer.config'; 
import { BadRequestException } from '@nestjs/common';

@Controller('records')
@UseGuards(JwtAuthGuard) 
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  // 1. UPLOAD REKAM MEDIS
  @Post()
  @Roles(Role.PATIENT) 
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions)) 
  async uploadRecord(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMedicalRecordDto,
    @GetUser() user: JwtUser,
  ) {
    if (!file) {
      throw new BadRequestException('File rekam medis wajib diunggah.');
    }
    
    return this.recordsService.create(user.sub, file, dto);
  }

  // 2. GET REKAM MEDIS BERDASARKAN ID (Pasien/Dokter/Admin)
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtUser,
  ) {
    return this.recordsService.findOne(id, user.sub, user.role as Role);
  }

  // 3. GET REKAM MEDIS BY APPOINTMENT ID
  @Get('appointment/:appointmentId')
  async findByAppointment(
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
    @GetUser() user: JwtUser,
  ) {
    return this.recordsService.findByAppointmentId(appointmentId, user.sub, user.role as Role);
  }

  // 4. DOWNLOAD FILE REKAM MEDIS
  @Get(':id/download')
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtUser,
  ) {
    return this.recordsService.getFileUrl(id, user.sub, user.role as Role);
  }
}