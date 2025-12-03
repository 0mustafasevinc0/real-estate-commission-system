# DESIGN.md: Komisyon Yönetim Sistemi Tasarımı

Bu belge, teknik vakanın temel gereksinimlerini karşılamak üzere seçilen mimari, veri modelleme ve iş mantığı kararlarını açıklamaktadır.

## 1. Mimari ve Yapısal Kararlar

Proje, NestJS'in standart **Modüler** ve **Katmanlı** mimarisine uygun olarak tasarlanmıştır.

| Modül | Amaç | Katmanlama |
| :--- | :--- | :--- |
| **`AppModule`** | Global yapılandırmalar (`ConfigModule`, `MongooseModule`). | Root |
| **`AgentsModule`** | Acente (Agent) temel CRUD işlemleri ve finansal döküm sorguları. | Controller, Service, Schema |
| **`TransactionsModule`** | İşlemin yaşam döngüsünü ve XState ile state yönetimi. | Controller, Service, Schema, XState Machine |

Bu yapı, iş mantığının HTTP katmanından (Controller) kesin bir şekilde ayrılmasını (Service) sağlar ve her bir domain'in (Agent, Transaction) bağımsız olarak geliştirilmesine olanak tanır.

### 1.1. XState State Machine Entegrasyonu

**Önemli Karar:** İşlem aşama yönetimi için **XState v5** kullanılmıştır.

**Gerekçe:**
1. **Tutarlı State Yönetimi:** Finite state machine mimarisi transaction akışına uygun mimaridedir. XState, karmaşık state geçişlerini merkezi olarak yönetir
2. **Test Edilebilirlik:** State machine mantığı bağımsız olarak test edilebilir
3. **Hata Ayıklama:** State geçişleri ve context değişiklikleri kolayca izlenebilir
4. **Geçiş Kuralları:** `agreement` → `earnest_money` → `title_deed` → `completed` akışı zorunlu kılınmıştır

## 2. Veri Modelleme (MongoDB)

Üç ana koleksiyon (`Agent`, `Transaction`, `FinancialBreakdown`) kullanılmıştır.

### 2.1. Merkezi Karar: Ayrı FinancialBreakdown Koleksiyonu

**Karar:** `FinancialBreakdown` verileri, `Transaction` dokümanına gömülmek yerine **ayrı bir koleksiyonda** tutulmaktadır.

**Gerekçe:**
1. **Normalizasyon:** Finansal veriler, kendi varlıkları olarak daha iyi organize edilir
2. **Sorgulama Esnekliği:** Agent bazlı sorgular (`/agents/:id/breakdowns`) daha verimli yapılır
3. **Büyüme Potansiyeli:** Gelecekte finansal analiz ve raporlama için daha esnek yapı
4. **Performans:** Büyük transaction dokümanlarının boyutunu kontrol altında tutar

### 2.2. Veri İlişkileri

```
Agent (1) ←→ (N) Transaction
Transaction (1) ←→ (N) FinancialBreakdown
Agent (1) ←→ (N) FinancialBreakdown (ownerId ile)
```

## 3. İş Mantığı Kararları

### A. Komisyon Hesaplama Kuralları

Komisyon hesaplama mantığı, XState machine'in `calculateCommissions` action'unda uygulanır ve `TransactionsService` tarafından yönetilir:

1. **Kurum (Agency) Payı:** `totalServiceFee`'nin %50'si her zaman kuruma atanır
2. **Acente Payı Havuzu:** Kalan %50, acenteler arasında paylaşılır
3. **Senaryo 1 (Aynı Acente):** `listingAgentId` == `sellingAgentId` ise, acente kalan %50'nin tamamını alır
4. **Senaryo 2 (Farklı Acente):** Acenteler farklı ise, havuz eşit paylaşılır (%25 Listeleme, %25 Satış)

### B. State Machine ile Aşama Geçişi

**XState Machine Yapısı:**
- **States:** `agreement`, `earnest_money`, `title_deed`, `completed`
- **Events:** `MOVE_TO_EARNEST_MONEY`, `MOVE_TO_TITLE_DEED`, `COMPLETE`
- **Actions:** `calculateCommissions` (completed aşamasında tetiklenir)
- **Context:** `totalServiceFee`, `listingAgentId`, `sellingAgentId`, `financialBreakdownIds`

**State Restorasyon:** Veritabanındaki mevcut aşamaya göre machine yeniden konumlandırılır.

## 4. API Uç Noktaları

### 4.1. Agent Endpoints
- `POST /api/agents` - Yeni acente oluşturma
- `GET /api/agents` - Tüm acenteleri listeleme
- `GET /api/agents/:id/breakdowns` - Acentenin tüm finansal dökümleri

### 4.2. Transaction Endpoints
- `POST /api/transactions` - Yeni işlem oluşturma
- `GET /api/transactions` - Tüm işlemleri listeleme
- `GET /api/transactions/:id` - Tek işlem detayları
- `PATCH /api/transactions/:id/stage` - İşlem aşamasını güncelleme

## 5. Teknoloji Yığını

| Katman | Teknoloji | Amaç |
| :--- | :--- | :--- |
| **Framework** | NestJS | Backend framework |
| **Database** | MongoDB + Mongoose | Veri depolama ve ODM |
| **State Management** | XState v5 | İşlem aşama yönetimi |
| **Validation** | class-validator | DTO validation |
| **Testing** | Jest | Unit ve integration testleri |
| **Frontend** | HTML/JavaScript | Basit web arayüzü |

## 6. Risk Analizi ve Gelecek Geliştirmeler

| Risk/Eksiklik | Açıklama | Gelecek Adım |
| :--- | :--- | :--- |
| **Yetkilendirme (Auth)** | API uç noktalarında kimlik doğrulama/yetkilendirme eksikliği. | `AuthModule` oluşturulmalı ve Controller'lara `Guard`'lar eklenmelidir. |
| **Para Birimi Hassasiyeti** | Hesaplamalarda basit `number` tipi kullanılmıştır. | Tüm finansal değerler, kuruş cinsinden tam sayı olarak saklanmalıdır. |
| **Denetleme (Auditing)** | İşlem aşaması değişikliklerinin geçmişi izlenmemektedir. | Ayrı bir `AuditLog` koleksiyonu oluşturularak önemli alan değişiklikleri kaydedilmelidir. |
| **Error Handling** | Global error handling stratejisi eksik. | `ExceptionFilter` ve global error handler eklenmelidir. |
| **Pagination** | Listeleme endpoint'lerinde pagination yok. | Büyük veri setleri için pagination eklenmelidir. |
| **Caching** | Sık sorgulanan veriler için cache mekanizması yok. | Redis veya benzeri cache katmanı eklenmelidir. |

## 7. Test Stratejisi

### 7.1. Unit Testler
- **Services:** Business logic ve XState entegrasyonu
- **Controllers:** HTTP endpoint'leri
- **State Machine:** Aşama geçişleri ve context yönetimi

### 7.2. Integration Testler
- **Database:** Mongoose entegrasyonu
- **API:** End-to-end endpoint testleri

## 8. Deployment ve Operasyon

### 8.1. Environment Variables
```
MONGO_URI=mongodb://localhost:27017/real-estate-commission
PORT=3000
```

### 8.2. Docker Support
- Containerization için Dockerfile hazırlanmalı
- Docker Compose ile MongoDB entegrasyonu sağlanmalı