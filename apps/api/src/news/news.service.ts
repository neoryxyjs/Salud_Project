import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

// Importación compatible con CommonJS y ESM
const RSSParser = require('rss-parser');

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
  private readonly parser = new RSSParser();

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
      // Buscar noticias sobre Isapres y salud en Chile, excluyendo política
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: '(isapres OR isapre OR "plan de salud" OR "seguro de salud" OR fonasa OR "superintendencia de salud") AND (salud OR medicina OR hospital OR clínica OR cobertura OR "ley corta") NOT (presidencial OR elección OR candidato OR político OR política OR votación)',
          language: 'es',
          sortBy: 'publishedAt',
          pageSize: limit * 3, // Obtener más para filtrar mejor
          apiKey: apiKey,
        },
        timeout: 5000, // 5 segundos de timeout
      });

      if (response.data.articles && response.data.articles.length > 0) {
        // Filtrar artículos que realmente sean sobre salud/isapres
        const healthKeywords = ['isapre', 'isapres', 'salud', 'plan de salud', 'seguro de salud', 'fonasa', 'superintendencia de salud', 'ley corta', 'cobertura', 'hospital', 'clínica', 'medicina'];
        const excludeKeywords = ['presidencial', 'elección', 'candidato', 'político', 'política', 'votación', 'gobierno', 'congreso', 'senado'];
        
        const filteredArticles = response.data.articles
          .filter((article: any) => {
            const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();
            // Debe contener al menos una palabra clave de salud
            const hasHealthKeyword = healthKeywords.some(keyword => text.includes(keyword));
            // No debe contener palabras clave de política
            const hasExcludeKeyword = excludeKeywords.some(keyword => text.includes(keyword));
            return hasHealthKeyword && !hasExcludeKeyword;
          })
          .slice(0, limit);

        return filteredArticles.map((article: any) => ({
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
        keywords: ['isapre', 'isapres', 'plan de salud', 'seguro de salud', 'fonasa', 'superintendencia de salud', 'ley corta', 'cobertura de salud', 'planes de salud', 'isapres de chile'],
        excludeKeywords: ['presidencial', 'elección', 'candidato', 'político', 'política', 'votación', 'gobierno', 'congreso', 'senado', 'diputado'],
      },
      {
        url: 'https://www.emol.com/rss/rss.aspx?seccion=nacional',
        source: 'Emol',
        keywords: ['isapre', 'isapres', 'plan de salud', 'seguro de salud', 'fonasa', 'superintendencia de salud', 'ley corta', 'planes de salud', 'isapres de chile'],
        excludeKeywords: ['presidencial', 'elección', 'candidato', 'político', 'política', 'votación', 'gobierno', 'congreso', 'senado', 'diputado'],
      },
      {
        url: 'https://www.latercera.com/rss/section/nacional/',
        source: 'La Tercera',
        keywords: ['isapre', 'isapres', 'plan de salud', 'seguro de salud', 'fonasa', 'superintendencia de salud', 'ley corta', 'planes de salud', 'isapres de chile'],
        excludeKeywords: ['presidencial', 'elección', 'candidato', 'político', 'política', 'votación', 'gobierno', 'congreso', 'senado', 'diputado'],
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
              // Debe contener al menos una palabra clave de salud
              const hasHealthKeyword = feed.keywords.some(keyword => text.includes(keyword));
              // No debe contener palabras clave excluidas (política)
              const hasExcludeKeyword = feed.excludeKeywords?.some(keyword => text.includes(keyword)) || false;
              return hasHealthKeyword && !hasExcludeKeyword;
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
    const now = new Date();
    return [
      {
        title: 'Sistema de Isapres: Últimas actualizaciones y cambios normativos',
        description: 'Conoce las últimas modificaciones en el sistema de Isapres y cómo afectan a los beneficiarios. La Superintendencia de Salud continúa trabajando en mejorar la transparencia y protección de los usuarios.',
        url: 'https://www.superdesalud.gob.cl',
        publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días atrás
        source: 'Superintendencia de Salud',
      },
      {
        title: 'Impacto de la Ley Corta en los planes de salud de Isapres',
        description: 'Análisis de cómo la reciente Ley Corta afectará los precios y beneficios de los planes de salud para los afiliados. Los cambios buscan mayor equidad en el sistema.',
        url: 'https://www.superdesalud.gob.cl',
        publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 días atrás
        source: 'Superintendencia de Salud',
      },
      {
        title: 'Consejos para elegir el mejor plan de Isapre en 2024',
        description: 'Expertos comparten recomendaciones clave para que los usuarios tomen decisiones informadas al contratar o cambiar su plan de salud. Compara coberturas, precios y beneficios.',
        url: 'https://www.superdesalud.gob.cl',
        publishedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 días atrás
        source: 'QuePlan',
      },
    ];
  }
}

