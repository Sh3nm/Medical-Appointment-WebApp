import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateMedicalRecordDto {
    @IsNumber()
    @IsNotEmpty()
    appointmentId: number;

    @IsString()
    @IsOptional()
    notes?: string;
}