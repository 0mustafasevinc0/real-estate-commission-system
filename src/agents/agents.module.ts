import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Agent, AgentSchema } from './schemas/agent.schema';
import { FinancialBreakdownService } from '../transactions/financial-breakdown.service';
import { FinancialBreakdown, FinancialBreakdownSchema } from '../transactions/schemas/financial-breakdown.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Agent.name, schema: AgentSchema },
      { name: FinancialBreakdown.name, schema: FinancialBreakdownSchema },
    ]),
  ],
  controllers: [AgentsController],
  providers: [AgentsService, FinancialBreakdownService],
  exports: [AgentsService], 
})
export class AgentsModule {}
