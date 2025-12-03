// src/transactions/transactions.controller.ts

import { Controller, Get, Param, Query, NotFoundException, Post, Body, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { FindAllTransactionsDto } from './dto/find-all-transactions.dto';
import { AgentBreakdownDto } from './dto/agent-breakdown.dto';
import { TransactionDocument } from './schemas/transaction.schema';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * API Uç Noktası 1: Yeni İşlem Başlatma
   * POST /transactions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDocument> {
    // Controller sadece veriyi alır ve Service'e iletir.
    return this.transactionsService.create(createTransactionDto);
  }

  /**
   * API Uç Noktası 2: İşlem Aşamasını Güncelleme
   * PATCH /transactions/:id/stage
   * Bu, kritik iş kuralını (sıralı aşama geçişi) Service'te tetikler.
   */
  @Patch(':id/stage')
  async updateStage(
    @Param('id') id: string,
    @Body() updateStageDto: UpdateStageDto,
  ): Promise<TransactionDocument> {
    // Hatalı aşama geçişleri (örneğin earnest_money'den completed'a atlama) Service katmanında yakalanır.
    return this.transactionsService.updateStage(id, updateStageDto);
  }

  /**
   * API Uç Noktası 3: Tüm İşlemleri Listeleme
   * GET /transactions
   * Sistemdeki tüm transactionları listeler
   */
  @Get()
  async findAll(@Query() findAllTransactionsDto: FindAllTransactionsDto): Promise<TransactionDocument[]> {
    return this.transactionsService.findAll();
  }

  /**
   * API Uç Noktası 4: Tek Bir İşlemi Getirme
   * GET /transactions/:id
   * Tamamlanmış işlemler için finansal döküm de dahil tüm detayları döndürür.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TransactionDocument> {
    return this.transactionsService.findOne(id);
  }
}