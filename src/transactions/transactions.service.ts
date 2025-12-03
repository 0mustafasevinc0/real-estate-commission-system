import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createActor } from 'xstate'; // XState Actor
import { Transaction, TransactionDocument, TransactionStage } from './schemas/transaction.schema';
import { FinancialBreakdownService } from './financial-breakdown.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { transactionMachine } from './transaction.machine';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private financialBreakdownService: FinancialBreakdownService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<TransactionDocument> {
    // Yeni işlem her zaman 'agreement' olarak başlar (Schema default'u)
    const createdTransaction = new this.transactionModel({
      ...createTransactionDto,
      currentStage: TransactionStage.AGREEMENT,
      financialBreakdownIds: [], 
    });
    return createdTransaction.save();
  }

  async findAll(): Promise<TransactionDocument[]> {
    return this.transactionModel.find().exec();
  }

  async findOne(id: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findById(id).exec();
    if (!transaction) throw new NotFoundException(`Transaction #${id} not found`);
    return transaction;
  }

  async updateStage(id: string, updateStageDto: UpdateStageDto): Promise<TransactionDocument> {
    // 1. Veritabanındaki mevcut işlemi çek
    const dbTransaction = await this.findOne(id);
    
    // Durumun tamamlanmış olması durumunda geçiş yapmaz
    if (dbTransaction.currentStage === TransactionStage.COMPLETED) {
      throw new BadRequestException('Cannot transition from completed stage');
    }

    // 2. Makineyi veritabanındaki veriyle ayağa kaldır (Rehydration)
    const actor = createActor(transactionMachine, {
      input: {
        totalServiceFee: dbTransaction.totalServiceFee,
        listingAgentId: dbTransaction.listingAgentId.toString(),
        sellingAgentId: dbTransaction.sellingAgentId.toString(),
        financialBreakdownIds: dbTransaction.financialBreakdownIds?.map(id => id.toString()) || [],
      },
    });

    actor.start();
    
    // Mevcut durumu makineye gönder
    const currentState = dbTransaction.currentStage;
    if (currentState === TransactionStage.EARNEST_MONEY) {
      actor.send({ type: 'MOVE_TO_EARNEST_MONEY' });
    } else if (currentState === TransactionStage.TITLE_DEED) {
      actor.send({ type: 'MOVE_TO_EARNEST_MONEY' });
      actor.send({ type: 'MOVE_TO_TITLE_DEED' });
    }
    // agreement veya completed ise geçiş yapmaz

    // 3. İstenen stage'e gitmek için hangi Event gerekli? (Mapping)
    // API'den "stage: completed" geliyor, biz bunu event'e çeviriyoruz.
    const targetEvent = this.mapStageToEvent(updateStageDto.newStage);
    
    if (!targetEvent) {
       // Eğer API'ye saçma bir stage gönderilirse
       throw new BadRequestException('Invalid target stage provided');
    }

    // 4. Event'i gönder
    actor.send({ type: targetEvent });
    
    // 5. Yeni durumu kontrol et
    const snapshot = actor.getSnapshot();

    // Eğer state değişmediyse, geçersiz bir geçiş denenmiştir (Örn: agreement -> completed)
    if (snapshot.value === dbTransaction.currentStage) {
      throw new BadRequestException(
        `Cannot transition from '${dbTransaction.currentStage}' to '${updateStageDto.newStage}'. Follow the sequence: agreement -> earnest_money -> title_deed -> completed`
      );
    }

    // 6. Yeni durumu ve (varsa) hesaplanan context'i DB'ye kaydet
    dbTransaction.currentStage = snapshot.value as TransactionStage;
    
    // Eğer completed ise komisyon hesaplaması yap ve FinancialBreakdown kayıtları oluştur
    if (snapshot.value === TransactionStage.COMPLETED && snapshot.context) {
      const totalFee = snapshot.context.totalServiceFee;
      const listingAgentId = new Types.ObjectId(snapshot.context.listingAgentId);
      const sellingAgentId = new Types.ObjectId(snapshot.context.sellingAgentId);
      
      // Komisyon hesapla
      const agencyShare = totalFee * 0.50;
      const agentsSharePool = totalFee * 0.50;
      
      let listingAgentShare = 0;
      let sellingAgentShare = 0;
      
      if (snapshot.context.listingAgentId === snapshot.context.sellingAgentId) {
        listingAgentShare = agentsSharePool;
        sellingAgentShare = 0;
      } else {
        listingAgentShare = agentsSharePool / 2;
        sellingAgentShare = agentsSharePool / 2;
      }
      
      // FinancialBreakdown verilerini oluştur
      const breakdownData = [];
      
      // 1. Kurum Dökümü
      breakdownData.push({
        ownerType: 'agency',
        ownerId: null,
        role: null,
        amount: agencyShare,
        percentage: 50,
      });
      
      // 2. Acente Dökümü
      if (snapshot.context.listingAgentId === snapshot.context.sellingAgentId) {
        breakdownData.push({
          ownerType: 'agent',
          ownerId: listingAgentId,
          role: 'listing',
          amount: listingAgentShare,
          percentage: 50,
        });
      } else {
        breakdownData.push({
          ownerType: 'agent',
          ownerId: listingAgentId,
          role: 'listing',
          amount: listingAgentShare,
          percentage: 25,
        });
        
        breakdownData.push({
          ownerType: 'agent',
          ownerId: sellingAgentId,
          role: 'selling',
          amount: sellingAgentShare,
          percentage: 25,
        });
      }
      
      // FinancialBreakdown kayıtlarını oluştur
      const createdBreakdowns = await this.financialBreakdownService.createBreakdowns(
        dbTransaction._id,
        breakdownData
      );
      
      // Transaction'ı güncelle
      dbTransaction.financialBreakdownIds = createdBreakdowns.map(b => b._id);
      dbTransaction.completionDate = new Date();
    }

    return dbTransaction.save() as Promise<TransactionDocument>;
  }

  // Yardımcı metot: API isteğini XState Event'ine çevirir
  private mapStageToEvent(targetStage: TransactionStage): 'MOVE_TO_EARNEST_MONEY' | 'MOVE_TO_TITLE_DEED' | 'COMPLETE' | null {
    switch (targetStage) {
      case TransactionStage.EARNEST_MONEY:
        return 'MOVE_TO_EARNEST_MONEY';
      case TransactionStage.TITLE_DEED:
        return 'MOVE_TO_TITLE_DEED';
      case TransactionStage.COMPLETED:
        return 'COMPLETE';
      default:
        return null;
    }
  }
}