// src/transactions/dto/create-transaction.dto.ts

import { IsNumber, IsNotEmpty, IsMongoId, Min } from 'class-validator';
import { Types } from 'mongoose';

export class CreateTransactionDto {
  // Listeleyen Acente ID'si
  @IsNotEmpty()
  @IsMongoId()
  listingAgentId: Types.ObjectId;

  // Satan Acente ID'si
  @IsNotEmpty()
  @IsMongoId()
  sellingAgentId: Types.ObjectId;

  // Toplam Hizmet Bedeli (Komisyon)
  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'Service fee must be a positive number.' })
  totalServiceFee: number;
}