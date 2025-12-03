# Komisyon Yönetim Sistemi (NestJS & MongoDB Atlas & XState v5)

Bu proje, bir emlak acentesi için işlemin yaşam döngüsünü takip eden ve tamamlanmış işlemler için komisyonu ajans ile acenteler arasında otomatik olarak dağıtan bir backend sistemidir.

## 🏗️ Teknik Özellikler

- **Framework:** NestJS (Node.js)
- **Database:** MongoDB + Mongoose
- **State Management:** XState v5 (İşlem aşama yönetimi)
- **Architecture:** Modular & Layered (Agents, Transactions, FinancialBreakdown)
- **Testing:** Jest (Unit & Integration Tests)
- **Validation:** class-validator

## 🌐 Canlı API URL (Deployment)

**https://example.com**
*Örnek Uç Nokta:* `GET https://example.com/api/transactions/60c72b2f9b1e8b0015b3c3c1`

## 🚀 Kurulum ve Yerel Geliştirme

### Ön Gereksinimler

* Node.js (v16+)
* npm
* MongoDB (Yerel veya Atlas)

### Kurulum Adımları

1. **Proje Klonlama:**
    ```bash
    git clone https://github.com/0mustafasevinc0/real-estate-commission-system.git
    cd real-estate-commission-system
    ```

2. **Bağımlılıkları Yükleme:**
    ```bash
    npm install
    ```

3. **Çevre Değişkenleri:**
    Projenin kök dizininde `.env` dosyası oluşturun:
    ```env
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/real-estate-commission
    # veya MongoDB Atlas için:
    # MONGO_URI="mongodb+srv://<username>:<password>@<cluster-url>/commissiondb?retryWrites=true&w=majority"
    ```

4. **Uygulamayı Başlatma:**
    ```bash
    # Geliştirme modu
    npm run start:dev
    
    # Üretim modu
    npm run start:prod
    ```

Uygulama `http://localhost:3000/api` adresinde çalışacaktır.

## 📋 API Uç Noktaları

### Agent Endpoints
- `POST /api/agents` - Yeni acente oluştur
- `GET /api/agents` - Tüm acenteleri listele
- `GET /api/agents/:id/breakdowns` - Acentenin finansal dökümleri

### Transaction Endpoints
- `POST /api/transactions` - Yeni işlem oluştur
- `GET /api/transactions` - Tüm işlemleri listele
- `GET /api/transactions/:id` - İşlem detayları
- `PATCH /api/transactions/:id/stage` - İşlem aşamasını güncelle

### System Endpoints
- `GET /api` - Web arayüzü (index.html)
- `GET /api/health` - Sistem health check

## 🔄 İş Akışı

1. **Aşamalar:** `agreement` → `earnest_money` → `title_deed` → `completed`
2. **Komisyon Hesaplama:** Sadece `completed` aşamasında tetiklenir
3. **Dağıtım Kuralları:**
   - %50 Kurum (Agency)
   - %50 Acenteler (Eşit veya tek acenteye tamamı)

## 🧪 Testler

```bash
npm run test              # Tüm testleri çalıştır
npm run test:cov          # Kapsam raporu ile çalıştır
npm run test:watch        # Watch modunda çalıştır
npm run test:e2e          # E2E testlerini çalıştır
```

### Test Kapsamı
- ✅ Komisyon hesaplama kuralları
- ✅ Aşama geçiş validasyonu
- ✅ XState state machine entegrasyonu
- ✅ API endpoint'leri
- ✅ Veritabanı operasyonları

## 🏛️ Mimari

### Modüller
- **AppModule:** Global yapılandırma
- **AgentsModule:** Acente yönetimi ve finansal sorgular
- **TransactionsModule:** İşlem yaşam döngüsü ve state yönetimi

### Veri Modeli
- **Agent:** Acente bilgileri
- **Transaction:** İşlem detayları ve aşamaları
- **FinancialBreakdown:** Komisyon dağıtım detayları (ayrı koleksiyon)

### State Machine (XState)
```typescript
States: agreement → earnest_money → title_deed → completed
Events: MOVE_TO_EARNEST_MONEY, MOVE_TO_TITLE_DEED, COMPLETE
Actions: calculateCommissions (completed aşamasında)
```

## 🎯 Web Arayüzü

`http://localhost:3000/api` adresinde basit bir web arayüzü mevcuttur:

- **Agent Operations:** Acente oluşturma, listeleme, finansal döküm sorgulama
- **Transaction Operations:** İşlem oluşturma, aşama güncelleme, detay görüntüleme
- **List All:** Tüm işlemleri ve acenteleri listeleme

## 📊 Örnek API Kullanımı

### Postman Koleksiyonu
Projeye özel Postman koleksiyonu eklendi! 📮

`ICEBERG.postman_collection.json` dosyasını Postman'a import ederek tüm API endpoint'lerini kolayca test edebilirsiniz. 

Veya /api üzerinden api işlemlerini yapabilir inspect>network üzerinden görüntüleyebilirsiniz.

### Manuel API Kullanımı

```javascript
// Yeni işlem oluştur
POST /api/transactions
{
  "totalServiceFee": 10000,
  "listingAgentId": "60c72b2f9b1e8b0015b3c3c1",
  "sellingAgentId": "60c72b2f9b1e8b0015b3c3c2"
}

// Aşamayı güncelle
PATCH /api/transactions/60c72b2f9b1e8b0015b3c3c1/stage
{
  "newStage": "completed"
}

// Acentenin kazançlarını görüntüle
GET /api/agents/60c72b2f9b1e8b0015b3c3c1/breakdowns
```

## 🔧 Geliştirme

### Proje Yapısı
```
src/
├── agents/                 # Acente modülü
├── transactions/           # İşlem modülü
│   ├── schemas/           # Mongoose şemaları
│   ├── dto/               # Data Transfer Objects
│   ├── transaction.machine.ts  # XState machine
│   └── financial-breakdown.service.ts
├── app.controller.ts      # Ana controller
└── app.module.ts          # Ana modül
```

---

**Not:** Detaylı mimari kararları ve tasarım dokümanı için `DESING.md` dosyasını inceleyin.