
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsDateString } from 'class-validator';

export class CreateCheckinDto {
  @IsUUID()
  @IsNotEmpty()
  subject_id: string;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  image_id?: string;

  @IsString()
  @IsOptional()
  device_id?: string;

  @IsDateString()
  @IsOptional()
  checkin_time?: Date;
}

export class UpdateCheckinDto {
    @IsString()
    @IsOptional()
    notes?: string;
}
