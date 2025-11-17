import { Controller, Get, Query } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async getNews(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 3;
    return this.newsService.getLatestNews(limitNumber);
  }
}

