import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { TransactionsService } from './transactions.service';
import { FinancialBreakdownService } from './financial-breakdown.service';
import { Transaction, TransactionStage } from './schemas/transaction.schema';
import { FinancialBreakdown, FinancialBreakdownDocument } from './schemas/financial-breakdown.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const MOCK_LISTING_AGENT_ID = new Types.ObjectId();
  const MOCK_SELLING_AGENT_ID = new Types.ObjectId();
  const MOCK_TRANSACTION_ID = '60c72b2f9b1e8b0015b3c3c1';
  const FEE = 10000;

const mockFinancialBreakdownService = {
  createBreakdowns: jest.fn().mockImplementation((transactionId: Types.ObjectId, breakdownData: any[]) => {
    return Promise.resolve(
      breakdownData.map((_: any, index: number) => ({
        _id: new Types.ObjectId(),
        ownerType: index === 0 ? 'agency' : 'agent',
        amount: index === 0 ? 5000 : 2500,
        percentage: index === 0 ? 50 : 25,
        role: index === 1 ? 'listing' : index === 2 ? 'selling' : null,
        ownerId: index === 1 ? new Types.ObjectId() : index === 2 ? new Types.ObjectId() : null,
        transactionId,
      }))
    );
  }),
  findByTransactionId: jest.fn(),
  deleteByTransactionId: jest.fn(),
};

const mockTransactionModel = {
  findById: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue({
      _id: MOCK_TRANSACTION_ID,
      currentStage: TransactionStage.AGREEMENT,
      totalServiceFee: 10000,
      listingAgentId: MOCK_LISTING_AGENT_ID,
      sellingAgentId: MOCK_SELLING_AGENT_ID,
      financialBreakdownIds: [],
      save: jest.fn().mockResolvedValue(true)
    })
  }),
  constructor: jest.fn().mockImplementation(function(doc) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue(this);
  }),
  create: jest.fn().mockResolvedValue({
    _id: '60c72b2f9b1e8b0015b3c3c1',
    save: jest.fn().mockResolvedValue(true)
  }),
  findOne: jest.fn().mockImplementation((query) => ({
    exec: jest.fn().mockResolvedValue({
      _id: '60c72b2f9b1e8b0015b3c3c1',
      ...query
    })
  }))
};

const MockTransactionModel = jest.fn().mockImplementation((doc) => {
  const instance = {
    ...doc,
    _id: new Types.ObjectId(),
    currentStage: TransactionStage.AGREEMENT,
    financialBreakdownIds: [],
    save: jest.fn().mockReturnThis()
  };
  return instance;
}) as any;
MockTransactionModel.findById = mockTransactionModel.findById;
MockTransactionModel.create = mockTransactionModel.create;
MockTransactionModel.findOne = mockTransactionModel.findOne;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        FinancialBreakdownService,
        {
          provide: getModelToken(Transaction.name),
          useValue: MockTransactionModel,
        },
        {
          provide: FinancialBreakdownService,
          useValue: mockFinancialBreakdownService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a transaction if found', async () => {
      const transaction = await service.findOne(MOCK_TRANSACTION_ID);
      expect(transaction).toBeDefined();
      expect(transaction._id).toBe(MOCK_TRANSACTION_ID);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockTransactionModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(null)
      });
      
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const createDto = {
        listingAgentId: MOCK_LISTING_AGENT_ID,
        sellingAgentId: MOCK_SELLING_AGENT_ID,
        totalServiceFee: FEE,
      };

      const result = await service.create(createDto);
      expect(result).toBeDefined();
      expect(result.listingAgentId).toBe(MOCK_LISTING_AGENT_ID);
      expect(result.sellingAgentId).toBe(MOCK_SELLING_AGENT_ID);
      expect(result.totalServiceFee).toBe(FEE);
      expect(result.currentStage).toBe(TransactionStage.AGREEMENT);
      expect(result.financialBreakdownIds).toEqual([]);
    });
  });

  describe('updateStage', () => {
    it('should update the transaction stage', async () => {
      const updateStageDto = {
        newStage: TransactionStage.EARNEST_MONEY
      };

      const result = await service.updateStage(MOCK_TRANSACTION_ID, updateStageDto);
      expect(result).toBeDefined();
    });
  });

  // ----------------------------------------------------------------------
  // KOMİSYON HESAPLAMA TESTLERİ (CORE BUSINESS LOGIC)
  // ----------------------------------------------------------------------

  describe('Commission Calculation Rules', () => {

    it('Senaryo 1: Listing ve Selling Agent AYNI ise %50 Agency, %50 Agent almalı', async () => {
      const transactionMock = {
        _id: MOCK_TRANSACTION_ID,
        totalServiceFee: FEE, 
        listingAgentId: MOCK_LISTING_AGENT_ID,
        sellingAgentId: MOCK_LISTING_AGENT_ID, 
        currentStage: TransactionStage.TITLE_DEED,
        financialBreakdownIds: [],
        save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }),
      };

      MockTransactionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(transactionMock)
      });

      const result = await service.updateStage(MOCK_TRANSACTION_ID, {
        newStage: TransactionStage.COMPLETED,
      });

      expect(result.financialBreakdownIds.length).toBe(2);

      // FinancialBreakdown servisinin çağrıldığını kontrol et
      expect(mockFinancialBreakdownService.createBreakdowns).toHaveBeenCalled();
      
      // Oluşturulan breakdown verilerini kontrol et
      const breakdownCall = mockFinancialBreakdownService.createBreakdowns.mock.calls[0];
      const breakdownData = breakdownCall[1];
      expect(breakdownData.length).toBe(2); 
    });

    it('Senaryo 2: Listing ve Selling Agent FARKLI ise %50 Agency, %25/25 Agent almalı', async () => {
      const transactionMock = {
        _id: MOCK_TRANSACTION_ID,
        totalServiceFee: FEE, 
        listingAgentId: MOCK_LISTING_AGENT_ID,
        sellingAgentId: MOCK_SELLING_AGENT_ID, 
        currentStage: TransactionStage.TITLE_DEED,
        financialBreakdownIds: [],
        save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }),
      };

      MockTransactionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(transactionMock)
      });

      const result = await service.updateStage(MOCK_TRANSACTION_ID, {
        newStage: TransactionStage.COMPLETED,
      });

      expect(result.financialBreakdownIds.length).toBe(3);

      // FinancialBreakdown servisinin çağrıldığını kontrol et
      expect(mockFinancialBreakdownService.createBreakdowns).toHaveBeenCalled();
      
      // Oluşturulan breakdown verilerini kontrol et
      const breakdownCall = mockFinancialBreakdownService.createBreakdowns.mock.calls[0];
      const breakdownData = breakdownCall[1];
      expect(breakdownData.length).toBe(3);
    });
  });
  
  // ----------------------------------------------------------------------
  // AŞAMA GEÇİŞ KURALLARI TESTLERİ
  // ----------------------------------------------------------------------

  describe('Transaction Stage Transitions', () => {
    const commonTransactionMock = (currentStage: TransactionStage) => ({
      _id: MOCK_TRANSACTION_ID,
      currentStage: currentStage,
      totalServiceFee: FEE,
      listingAgentId: MOCK_LISTING_AGENT_ID,
      sellingAgentId: MOCK_SELLING_AGENT_ID,
      financialBreakdownIds: [],
      save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }), 
    });

    it('Geçerli Geçiş: agreement -> earnest_money başarılı olmalı', async () => {
      const mock = commonTransactionMock(TransactionStage.AGREEMENT);
      mockTransactionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mock)
      });
      
      await service.updateStage(MOCK_TRANSACTION_ID, {
        newStage: TransactionStage.EARNEST_MONEY,
      });

      expect(mock.currentStage).toBe(TransactionStage.EARNEST_MONEY);
      expect(mock.save).toHaveBeenCalled();
    });

    it('Geçersiz Geçiş: earnest_money -> completed engellenmeli (title_deed atlandı)', async () => {
      const mock = commonTransactionMock(TransactionStage.EARNEST_MONEY);
      mockTransactionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mock)
      });
      
      await expect(
        service.updateStage(MOCK_TRANSACTION_ID, {
          newStage: TransactionStage.COMPLETED,
        })
      ).rejects.toThrow(BadRequestException);
      
      expect(mock.currentStage).toBe(TransactionStage.EARNEST_MONEY);
      expect(mock.save).not.toHaveBeenCalled();
    });

    it('Tamamlanmış işlemden geriye veya başka bir aşamaya geçiş engellenmeli', async () => {
      const mock = commonTransactionMock(TransactionStage.COMPLETED);
      mockTransactionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mock)
      });
      
      await expect(
        service.updateStage(MOCK_TRANSACTION_ID, {
          newStage: TransactionStage.EARNEST_MONEY,
        })
      ).rejects.toThrow(BadRequestException); 
      
      expect(mock.save).not.toHaveBeenCalled();
    });

    it('Bilinmeyen bir ID ile güncelleme yapılırsa NotFoundException fırlatılmalı', async () => {
        mockTransactionModel.findById.mockReturnValue({
          exec: jest.fn().mockResolvedValue(null)
        }); 
        
        await expect(
          service.updateStage('nonExistentId', {
            newStage: TransactionStage.EARNEST_MONEY,
          })
        ).rejects.toThrow(NotFoundException);
    });
  });
});