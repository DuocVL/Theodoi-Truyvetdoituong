
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

/**
 * Defines the data transfer object for creating a new check-in.
 * It uses class-validator decorators to enforce validation rules on incoming request bodies.
 */
export class CreateCheckinDto {
  @IsUUID()
  @IsNotEmpty({ message: 'Subject ID cannot be empty.' })
  public subject_id: string;

  @IsLatitude()
  @IsNotEmpty({ message: 'Latitude is required.' })
  public latitude: number;

  @IsLongitude()
  @IsNotEmpty({ message: 'Longitude is required.' })
  public longitude: number;

  @IsString()
  @IsOptional()
  public notes?: string;

  @IsUUID()
  @IsOptional()
  public image_id?: string;

  @IsString()
  @IsOptional()
  public device_id?: string;

  @IsDateString()
  @IsOptional()
  public checkin_time?: Date;
}

/**
 * Defines the data transfer object for updating an existing check-in.
 * All fields are optional to allow for partial updates (PATCH method).
 */
export class UpdateCheckinDto {
  @IsString()
  @IsOptional()
  public notes?: string;

  // Example of another updatable field. Uncomment if you want to allow image changes.
  // @IsUUID()
  // @IsOptional()
  // public image_id?: string;
}
