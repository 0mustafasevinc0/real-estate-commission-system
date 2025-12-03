import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Aşamalar
export enum TransactionStage {
  AGREEMENT = 'agreement',
  EARNEST_MONEY = 'earnest_money',
  TITLE_DEED = 'title_deed',
  COMPLETED = 'completed',
}

// Ana Transaction Şeması
export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  listingAgentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  sellingAgentId: Types.ObjectId;

  @Prop({ required: true })
  totalServiceFee: number;

  @Prop({ 
    type: String, 
    enum: Object.values(TransactionStage), 
    default: TransactionStage.AGREEMENT 
  })
  currentStage: TransactionStage; // İşlem aşamasını izler

  @Prop({ type: [Types.ObjectId], ref: 'FinancialBreakdown', default: [] })
  financialBreakdownIds: Types.ObjectId[]; // FinancialBreakdown koleksiyonuna referanslar

  @Prop()
  completionDate: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);