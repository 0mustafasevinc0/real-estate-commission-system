import { setup, assign } from 'xstate';

// 1. Context: Makinenin hafızasında tutacağı veriler
export interface TransactionContext {
  totalServiceFee: number;
  listingAgentId: string;
  sellingAgentId: string;
  financialBreakdownIds?: string[]; // breakdown ID'leri tutacağız
}

// 2. Events: Dışarıdan tetiklenecek olaylar
export type TransactionEvent = 
  | { type: 'MOVE_TO_EARNEST_MONEY' }
  | { type: 'MOVE_TO_TITLE_DEED' }
  | { type: 'COMPLETE' };

// 3. Machine Setup
export const transactionMachine = setup({
  types: {
    context: {} as TransactionContext,
    events: {} as TransactionEvent,
    input: {} as Partial<TransactionContext>,
  },
  actions: {
    calculateCommissions: assign(({ context }) => {
      if (!context) {
        return {};
      }
      
      const totalFee = context.totalServiceFee;

      // Şirket Payı: %50
      const agencyShare = totalFee * 0.50;
      
      // Ajan Payı Havuzu: %50
      const agentsSharePool = totalFee * 0.50;

      let listingAgentShare = 0;
      let sellingAgentShare = 0;

      // Scenario 1: İlanı açan ve satan aynı kişi
      if (context.listingAgentId === context.sellingAgentId) {
        listingAgentShare = agentsSharePool; // %100 of agent portion
        sellingAgentShare = 0;
      } 
      // Scenario 2: Farklı kişiler
      else {
        listingAgentShare = agentsSharePool / 2; // %25 total
        sellingAgentShare = agentsSharePool / 2; // %25 total
      }

      // Artık breakdown'ları burada oluşturmayacağız, sadece ID'leri döndüreceğiz
      // Service katmanında bu bilgilere göre FinancialBreakdown dokümanları oluşturulacak
      
      return {
        financialBreakdownIds: [], // Service katmanı dolduracak
      };
    }),
  },
}).createMachine({
  id: 'transaction',
  initial: 'agreement', // Başlangıç durumu
  context: ({ input }) => {
    // Input null/undefined kontrolü
    if (!input) {
      return {
        totalServiceFee: 0,
        listingAgentId: '',
        sellingAgentId: '',
        financialBreakdownIds: [],
      };
    }
    
    return {
      totalServiceFee: input.totalServiceFee || 0,
      listingAgentId: input.listingAgentId || '',
      sellingAgentId: input.sellingAgentId || '',
      financialBreakdownIds: input.financialBreakdownIds || [],
    };
  },
  states: {
    agreement: {
      on: {
        MOVE_TO_EARNEST_MONEY: { target: 'earnest_money' },
      },
    },
    earnest_money: {
      on: {
        MOVE_TO_TITLE_DEED: { target: 'title_deed' },
      },
    },
    title_deed: {
      on: {
        COMPLETE: { 
          target: 'completed',
          actions: 'calculateCommissions', // Geçiş anında hesapla
        },
      },
    },
    completed: {
      type: 'final', // Buradan artık çıkış yok
    },
  },
});