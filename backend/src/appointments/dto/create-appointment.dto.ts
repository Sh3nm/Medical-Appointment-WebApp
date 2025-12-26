import { IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateAppointmentDto {
  @IsNumber()
  @IsNotEmpty()
  doctorId: number;

  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;
}