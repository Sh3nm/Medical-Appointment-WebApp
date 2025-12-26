import { Controller, Get, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../common/guards/roles.guard'; 
// import { Roles } from '../common/decorators/roles.decorator'; 
// import { Role } from '@prisma/client';

@Controller('doctors')
@UseGuards(JwtAuthGuard) 
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // 1. GET LIST SEMUA DOKTER (Untuk Pasien)
  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  // 2. GET DETAIL DOKTER
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.findOne(id);
  }

  // 3. UPDATE DATA DOKTER (Hanya untuk Admin/Doctor yang bersangkutan)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ) {
    return this.doctorsService.update(id, updateDoctorDto);
  }
}