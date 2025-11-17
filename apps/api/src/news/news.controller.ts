import { Controller, Get, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsItem } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async getNews(@Query('limit') limit?: string): Promise<NewsItem[]> {
    try {
      const limitNumber = limit ? parseInt(limit, 10) : 3;
      // Validar que el límite sea razonable
      const validLimit = Math.min(Math.max(limitNumber, 1), 20);
      return await this.newsService.getLatestNews(validLimit);
    } catch (error: any) {
      // Si hay un error, devolver noticias por defecto en lugar de fallar
      console.error('Error in news controller:', error);
      return this.newsService.getDefaultNews();
    }
  }
}

