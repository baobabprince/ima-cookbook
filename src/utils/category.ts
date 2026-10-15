import { RecipeCategory } from '../types/recipe';

export const CATEGORY_EMOJIS: Record<RecipeCategory, string> = {
  'לחמים, חלות ופיתות': '🍞',
  'שוקולד, בראוניז ומשקאות': '🍫',
  'עוגות גבינה, מוס ושבועות': '🍰',
  'עוגות פירות, הדרים ובחושות': '🍊',
  'עוגיות, חיתוכיות וממתקים': '🍪',
  'סופגניות, מטוגנים וליקרים': '🍩',
  'מאפים מלוחים וקרקרים': '🥐',
};

export function getCategoryEmoji(category: RecipeCategory | string): string {
  return CATEGORY_EMOJIS[category as RecipeCategory] || '🍽️';
}
