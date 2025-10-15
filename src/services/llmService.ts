import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { getLLM } from '../config/llm';
import { logger } from '../utils/logger';
import { getCached, setCached, getCacheKey } from '../utils/cache';

const QueryIntentSchema = z.object({
  queryType: z.enum(['mcc_search', 'category_search']).describe('Тип запроса'),
  bankName: z.string().nullable().describe('Название банка'),
  category: z.string().nullable().describe('Категория товаров/услуг'),
  mccCode: z.string().nullable().describe('MCC-код (4 цифры)'),
});

export type QueryIntent = z.infer<typeof QueryIntentSchema>;

export class LLMService {
  async parseQuery(text: string): Promise<QueryIntent> {
    try {
      // Check cache first
      const cacheKey = getCacheKey('llm', 'parse', text);
      const cached = getCached<QueryIntent>(cacheKey);
      if (cached) {
        return cached;
      }

      const parser = StructuredOutputParser.fromZodSchema(QueryIntentSchema);

      const prompt = PromptTemplate.fromTemplate(
        `Проанализируй запрос пользователя и извлеки информацию.

Запрос: {query}

Правила:
- queryType должен быть "mcc_search" если пользователь ищет категорию по MCC-коду
- queryType должен быть "category_search" если пользователь ищет MCC-коды по категории
- Извлеки название банка если оно упоминается (Сбербанк, Тинькофф, Альфа-Банк и т.д.)
- Извлеки категорию если это category_search (одежда, рестораны, АЗС и т.д.)
- Извлеки MCC-код если это mcc_search (должно быть ровно 4 цифры)

{format_instructions}`,
      );

      const llm = getLLM();
      const chain = prompt.pipe(llm).pipe(parser);

      const result = await chain.invoke({
        query: text,
        format_instructions: parser.getFormatInstructions(),
      });

      // Cache the result
      setCached(cacheKey, result, 3600000); // 1 hour

      logger.info('Query parsed successfully:', { text, result });

      return result;
    } catch (error) {
      logger.error('Error parsing query with LLM:', { error, text });
      
      // Fallback: simple pattern matching
      return this.fallbackParse(text);
    }
  }

  private fallbackParse(text: string): QueryIntent {
    const mccMatch = text.match(/\b(\d{4})\b/);
    
    if (mccMatch) {
      return {
        queryType: 'mcc_search',
        bankName: this.extractBankName(text),
        category: null,
        mccCode: mccMatch[1],
      };
    }

    return {
      queryType: 'category_search',
      bankName: this.extractBankName(text),
      category: text,
      mccCode: null,
    };
  }

  private extractBankName(text: string): string | null {
    const banks = [
      'сбербанк',
      'сбер',
      'тинькофф',
      'тиньков',
      'альфа',
      'втб',
      'райффайзен',
      'газпромбанк',
    ];

    const lowerText = text.toLowerCase();
    for (const bank of banks) {
      if (lowerText.includes(bank)) {
        return bank;
      }
    }

    return null;
  }
}

