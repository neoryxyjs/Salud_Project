import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import Parser from 'rss-parser';

export interface NewsItem {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  image?: string;
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly parser = new Parser();

  async getLatestNews(limit: number = 3): Promise<NewsItem[]> {
    try {
      // Intentar obtener noticias de NewsAPI primero
      const newsApiKey = process.env.NEWS_API_KEY;
      if (newsApiKey) {
        try {
          const newsApiResults = await this.getNewsFromNewsAPI(newsApiKey, limit);
          if (newsApiResults && newsApiResults.length > 0) {
            return newsApiResults;
          }
        } catch (error) {
          this.logger.warn('NewsAPI failed, falling back to RSS feeds', error);
        }
      }

      // Fallback a RSS feeds de medios chilenos
      return await this.getNewsFromRSS(limit);
    } catch (error) {
      this.logger.error('Error fetching news', error);
      // Retornar noticias por defecto si todo falla
      return this.getDefaultNews();
    }
  }

  private async getNewsFromNewsAPI(apiKey: string, limit: number): Promise<NewsItem[]> {
    try {
      // Buscar noticias sobre Isapres en Chile con timeout
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'isapres OR isapre Chile',
          language: 'es',
          sortBy: 'publishedAt',
          pageSize: limit,
          apiKey: apiKey,
        },
        timeout: 5000, // 5 segundos de timeout
      });

      if (response.data.articles && response.data.articles.length > 0) {
        return response.data.articles.slice(0, limit).map((article: any) => ({
          title: article.title || 'Sin título',
          description: article.description || article.content?.substring(0, 150) || '',
          url: article.url,
          publishedAt: article.publishedAt,
          source: article.source?.name || 'Noticias',
          image: article.urlToImage,
        }));
      }
      return [];
    } catch (error: any) {
      this.logger.warn('Error fetching from NewsAPI:', error.message);
      return [];
    }
  }

  private async getNewsFromRSS(limit: number): Promise<NewsItem[]> {
    const newsItems: NewsItem[] = [];
    const rssFeeds = [
      {
        url: 'https://www.24horas.cl/rss/site/portada',
        source: '24 Horas',
        keywords: ['isapre', 'isapres', 'salud', 'fonasa'],
      },
      {
        url: 'https://www.emol.com/rss/rss.aspx?seccion=nacional',
        source: 'Emol',
        keywords: ['isapre', 'isapres', 'salud'],
      },
      {
        url: 'https://www.latercera.com/rss/section/nacional/',
        source: 'La Tercera',
        keywords: ['isapre', 'isapres', 'salud'],
      },
    ];

    // Crear promesas con timeout para cada feed
    const feedPromises = rssFeeds.map(async (feed) => {
      try {
        // Usar Promise.race para agregar timeout
        const feedData = await Promise.race([
          this.parser.parseURL(feed.url),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          ),
        ]) as any;
        
        if (feedData.items) {
          const relevantItems = feedData.items
            .filter((item: any) => {
              const text = `${item.title || ''} ${item.contentSnippet || item.content || ''}`.toLowerCase();
              return feed.keywords.some(keyword => text.includes(keyword));
            })
            .slice(0, limit)
            .map((item: any) => ({
              title: item.title || 'Sin título',
              description: item.contentSnippet || item.content?.substring(0, 150) || '',
              url: item.link || '#',
              publishedAt: item.pubDate || new Date().toISOString(),
              source: feed.source,
            }));

          return relevantItems;
        }
        return [];
      } catch (error: any) {
        this.logger.warn(`Error fetching RSS from ${feed.source}:`, error.message);
        return [];
      }
    });

    // Ejecutar todas las promesas en paralelo
    const results = await Promise.allSettled(feedPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        newsItems.push(...result.value);
      }
      
      if (newsItems.length >= limit) {
        break;
      }
    }

    // Si no hay suficientes noticias, agregar noticias por defecto
    if (newsItems.length < limit) {
      const defaultNews = this.getDefaultNews();
      newsItems.push(...defaultNews.slice(0, limit - newsItems.length));
    }

    return newsItems.slice(0, limit);
  }

  getDefaultNews(): NewsItem[] {
    return [
      {
        title: 'Sistema de Isapres: Últimas actualizaciones y cambios normativos',
        description: 'Conoce las últimas modificaciones en el sistema de Isapres y cómo afectan a los beneficiarios.',
        url: 'https://www.superdesalud.gob.cl',
        publishedAt: new Date().toISOString(),
        source: 'Superintendencia de Salud',
      },
      {
        title: 'Nuevas regulaciones para planes de salud en Chile',
        description: 'El gobierno anuncia nuevas medidas para mejorar la transparencia y cobertura de los planes de salud.',
        url: 'https://www.minsal.cl',
        publishedAt: new Date().toISOString(),
        source: 'Ministerio de Salud',
      },
      {
        title: 'Guía para elegir el mejor plan de Isapre',
        description: 'Consejos y recomendaciones para seleccionar el plan de salud que mejor se adapte a tus necesidades.',
        url: '#',
        publishedAt: new Date().toISOString(),
        source: 'QuePlan',
      },
    ];
  }
}

