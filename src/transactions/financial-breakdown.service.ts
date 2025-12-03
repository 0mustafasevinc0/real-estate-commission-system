import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FinancialBreakdown, FinancialBreakdownDocument } from './schemas/financial-breakdown.schema';

@Injectable()
export class FinancialBreakdownService {
  constructor(
    @InjectModel(FinancialBreakdown.name) private financialBreakdownModel: Model<FinancialBreakdownDocument>,
  ) {}

  async createBreakdowns(transactionId: Types.ObjectId, breakdownData: any[]): Promise<FinancialBreakdownDocument[]> {
    const breakdowns = breakdownData.map(data => ({
      ...data,
      transactionId,
    }));

    const createdBreakdowns = await this.financialBreakdownModel.insertMany(breakdowns);
    return createdBreakdowns as FinancialBreakdownDocument[];
  }

  async findByTransactionId(transactionId: Types.ObjectId): Promise<FinancialBreakdownDocument[]> {
    return this.financialBreakdownModel.find({ transactionId }).exec();
  }

  async findByAgentId(agentId: Types.ObjectId): Promise<FinancialBreakdownDocument[]> {
    return this.financialBreakdownModel.find({ ownerId: agentId }).exec();
  }

  async deleteByTransactionId(transactionId: Types.ObjectId): Promise<void> {
    await this.financialBreakdownModel.deleteMany({ transactionId }).exec();
  }
}
