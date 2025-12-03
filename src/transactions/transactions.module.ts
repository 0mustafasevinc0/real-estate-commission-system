import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { FinancialBreakdownService } from './financial-breakdown.service';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { FinancialBreakdown, FinancialBreakdownSchema } from './schemas/financial-breakdown.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: FinancialBreakdown.name, schema: FinancialBreakdownSchema },
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, FinancialBreakdownService],
})
export class TransactionsModule {}
