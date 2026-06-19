
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class RegisterFaceDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  public embedding: number[];
}
