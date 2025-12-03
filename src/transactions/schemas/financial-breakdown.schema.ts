import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class FinancialBreakdown {
  @Prop({ required: true })
  ownerType: 'agency' | 'agent';

  @Prop({ type: Types.ObjectId, ref: 'Agent', default: null })
  ownerId: Types.ObjectId | null;
  
  @Prop({ type: String, enum: ['listing', 'selling'], default: null })
  role: 'listing' | 'selling' | null;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  percentage: number;

  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: true })
  transactionId: Types.ObjectId;
}

export type FinancialBreakdownDocument = FinancialBreakdown & Document;
export const FinancialBreakdownSchema = SchemaFactory.createForClass(FinancialBreakdown);
