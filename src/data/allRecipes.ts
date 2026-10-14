import { Recipe, RecipeCategory } from '../types/recipe';
import { RECIPES_PART_1 } from './recipesPart1';
import { RECIPES_PART_2 } from './recipesPart2';
import { RECIPES_PART_3 } from './recipesPart3';
import { RECIPES_PART_4 } from './recipesPart4';

export const INITIAL_RECIPES: Recipe[] = [
  ...RECIPES_PART_1,
  ...RECIPES_PART_2,
  ...RECIPES_PART_3,
  ...RECIPES_PART_4,
].sort((a, b) => a.orderIndex - b.orderIndex);

export const RECIPE_CATEGORIES: RecipeCategory[] = [
  'לחמים, חלות ופיתות',
  'שוקולד, בראוניז ומשקאות',
  'עוגות גבינה, מוס ושבועות',
  'עוגות פירות, הדרים ובחושות',
  'עוגיות, חיתוכיות וממתקים',
  'סופגניות, מטוגנים וליקרים',
  'מאפים מלוחים וקרקרים',
];
