import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger';

interface ParsedCategory {
  name: string;
  mccCodes: string[];
  cashbackRate?: number;
}

export class PDFService {
  async parsePDF(buffer: Buffer): Promise<ParsedCategory[]> {
    try {
      const data = await pdfParse(buffer);
      const text = data.text;

      logger.info('PDF parsed, extracting categories...');

      return this.extractCategories(text);
    } catch (error) {
      logger.error('Error parsing PDF:', { error });
      throw error;
    }
  }

  private extractCategories(text: string): ParsedCategory[] {
    const categories: ParsedCategory[] = [];
    const lines = text.split('\n');

    let currentCategory: ParsedCategory | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Try to match MCC codes (4 digits, possibly comma-separated)
      const mccMatch = trimmed.match(/(\d{4}(?:,\s*\d{4})*)/);
      
      if (mccMatch) {
        const mccCodes = mccMatch[1].split(',').map((code) => code.trim());
        
        if (currentCategory) {
          currentCategory.mccCodes.push(...mccCodes);
        }
      } else {
        // This might be a category name
        if (currentCategory && currentCategory.mccCodes.length > 0) {
          categories.push(currentCategory);
        }

        // Extract cashback rate if present
        const rateMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*%/);
        const cashbackRate = rateMatch ? parseFloat(rateMatch[1]) : undefined;

        // Create new category
        currentCategory = {
          name: trimmed.replace(/\d+(?:\.\d+)?%/, '').trim(),
          mccCodes: [],
          cashbackRate,
        };
      }
    }

    // Add the last category
    if (currentCategory && currentCategory.mccCodes.length > 0) {
      categories.push(currentCategory);
    }

    logger.info('Categories extracted from PDF:', { count: categories.length });

    return categories.filter((cat) => cat.name && cat.mccCodes.length > 0);
  }

  validateMccCode(code: string): boolean {
    return /^\d{4}$/.test(code);
  }

  validateCategories(categories: ParsedCategory[]): boolean {
    for (const category of categories) {
      if (!category.name || category.name.length < 2) {
        return false;
      }

      if (!category.mccCodes || category.mccCodes.length === 0) {
        return false;
      }

      for (const code of category.mccCodes) {
        if (!this.validateMccCode(code)) {
          return false;
        }
      }
    }

    return true;
  }
}

