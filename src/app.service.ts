import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getIndexHtml(): string {
    try {
      const filePath = join(process.cwd(), 'public', 'index.html');
      return readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error('Index.html file not found');
    }
  }
}
