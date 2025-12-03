import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AgentsService } from './agents.service';
import { Agent } from './schemas/agent.schema';
import { FinancialBreakdownService } from '../transactions/financial-breakdown.service';

// Mock Agent Model
const mockAgentModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  constructor: jest.fn().mockImplementation(function(doc) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue(this);
  }),
};

// Mock FinancialBreakdownService
const mockFinancialBreakdownService = {
  findByAgentId: jest.fn(),
  createBreakdowns: jest.fn(),
  findByTransactionId: jest.fn(),
  deleteByTransactionId: jest.fn(),
};

const MockAgentModel = jest.fn().mockImplementation((doc) => {
  const instance = {
    ...doc,
    _id: '60c72b2f9b1e8b0015b3c3c1',
    save: jest.fn().mockReturnThis()
  };
  return instance;
}) as any;
MockAgentModel.create = mockAgentModel.create;
MockAgentModel.find = mockAgentModel.find;
MockAgentModel.findById = mockAgentModel.findById;
MockAgentModel.findByIdAndUpdate = mockAgentModel.findByIdAndUpdate;
MockAgentModel.findByIdAndDelete = mockAgentModel.findByIdAndDelete;

describe('AgentsService', () => {
  let service: AgentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: getModelToken(Agent.name),
          useValue: MockAgentModel,
        },
        {
          provide: FinancialBreakdownService,
          useValue: mockFinancialBreakdownService,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
