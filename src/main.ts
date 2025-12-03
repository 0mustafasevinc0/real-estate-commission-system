import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
      // DTO'da tanımlı olmayan tüm fazlalık alanları temizler (güvenlik için önemli)
      whitelist: true, 
      // Gelen veriyi DTO'daki beklenen tiplere (string'den number'a vb.) dönüştürür
      transform: true, 
      // Whitelist'te olmayan bir alan gelirse hata fırlatır
      forbidNonWhitelisted: true, 
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
