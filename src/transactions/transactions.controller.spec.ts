import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { getModelToken } from '@nestjs/mongoose';
import { Transaction, TransactionStage } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { Types } from 'mongoose';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransactionsService = {
    create: jest.fn(),
    updateStage: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: getModelToken(Transaction.name),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction', async () => {
      const createDto: CreateTransactionDto = {
        listingAgentId: new Types.ObjectId('60c72b2f9b1e8b0015b3c3c1'),
        sellingAgentId: new Types.ObjectId('60c72b2f9b1e8b0015b3c3c2'),
        totalServiceFee: 10000,
      };

      mockTransactionsService.create.mockResolvedValue(createDto);
      const result = await controller.create(createDto);
      
      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateStage', () => {
    it('should update transaction stage', async () => {
      const transactionId = '60c72b2f9b1e8b0015b3c3c1';
      const updateStageDto: UpdateStageDto = { newStage: TransactionStage.EARNEST_MONEY };
      
      mockTransactionsService.updateStage.mockResolvedValue({ id: transactionId, ...updateStageDto });
      const result = await controller.updateStage(transactionId, updateStageDto);
      
      expect(result).toBeDefined();
      expect(service.updateStage).toHaveBeenCalledWith(transactionId, updateStageDto);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      const transactionId = '60c72b2f9b1e8b0015b3c3c1';
      mockTransactionsService.findOne.mockResolvedValue({ _id: transactionId });
      
      const result = await controller.findOne(transactionId);
      
      expect(result).toBeDefined();
      expect(service.findOne).toHaveBeenCalledWith(transactionId);
    });
  });
});
