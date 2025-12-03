// src/agents/agents.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Agent, AgentDocument } from './schemas/agent.schema';
import { CreateAgentDto } from './dto/create-agent.dto';
import { FinancialBreakdownService } from '../transactions/financial-breakdown.service';

@Injectable()
export class AgentsService {
  constructor(
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
    private financialBreakdownService: FinancialBreakdownService,
  ) {}

  /**
   * Yeni bir acente kaydı oluşturur.
   */
  async create(createAgentDto: CreateAgentDto): Promise<AgentDocument> {
    const createdAgent = new this.agentModel(createAgentDto);
    return createdAgent.save();
  }

  /**
   * Tüm acenteleri listeler
   */
  async findAll(): Promise<AgentDocument[]> {
    return this.agentModel.find().exec();
  }
  
  // Opsiyonel: ID ile acente bulma metodu (ileride Transaction'larda kullanılabilir)
  async findOne(id: string): Promise<AgentDocument> {
    const agent = await this.agentModel.findById(id).exec();

    // Kontrol ekleniyor: Eğer agent null ise, hata fırlat.
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found.`);
    }
    return agent;
  }

  /**
   * Agent'ın tüm FinancialBreakdown kayıtlarını listeler
   */
  async findAgentBreakdowns(agentId: string): Promise<any[]> {
    // Agent'ın var olduğunu kontrol et
    await this.findOne(agentId);
    
    // Agent'ın tüm FinancialBreakdown kayıtlarını bul
    const agentObjectId = new Types.ObjectId(agentId);
    const breakdowns = await this.financialBreakdownService.findByAgentId(agentObjectId);
    return breakdowns;
  }
}