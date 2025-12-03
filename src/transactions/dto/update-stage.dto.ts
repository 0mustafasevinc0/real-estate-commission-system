// src/transactions/dto/update-stage.dto.ts

import { IsEnum, IsNotEmpty } from 'class-validator';
import { TransactionStage } from '../schemas/transaction.schema';

export class UpdateStageDto {
  // Yeni aşama, sadece tanımlı enum değerlerinden biri olabilir
  @IsNotEmpty()
  @IsEnum(TransactionStage)
  newStage: TransactionStage;
}