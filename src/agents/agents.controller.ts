// src/agents/agents.controller.ts

import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentDocument } from './schemas/agent.schema';
import { CreateAgentDto } from './dto/create-agent.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  
  async create(@Body() createAgentDto: CreateAgentDto): Promise<AgentDocument> {
    return this.agentsService.create(createAgentDto);
  }

  @Get()
  async findAll(): Promise<AgentDocument[]> {
    return this.agentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AgentDocument> {
    return this.agentsService.findOne(id);
  }

  /**
   * Agent'ın tüm FinancialBreakdown kayıtlarını listeler
   * GET /agents/:agentId/breakdowns
   */
  @Get(':agentId/breakdowns')
  async findAgentBreakdowns(@Param('agentId') agentId: string): Promise<any[]> {
    return this.agentsService.findAgentBreakdowns(agentId);
  }
}