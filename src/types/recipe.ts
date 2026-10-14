export type RecipeCategory =
  | 'לחמים, חלות ופיתות'
  | 'שוקולד, בראוניז ומשקאות'
  | 'עוגות גבינה, מוס ושבועות'
  | 'עוגות פירות, הדרים ובחושות'
  | 'עוגיות, חיתוכיות וממתקים'
  | 'סופגניות, מטוגנים וליקרים'
  | 'מאפים מלוחים וקרקרים';

export interface IngredientItem {
  amount?: number;
  amountMax?: number;
  unit?: string;
  item: string;
  note?: string;
}

export interface IngredientGroup {
  groupTitle?: string;
  items: IngredientItem[];
}

export interface RecipeStep {
  text: string;
  timerMinutes?: number;
  timerLabel?: string;
}

export interface Recipe {
  id: string;
  orderIndex: number; // Preserves exact sequence in Mom's notebook (1..N)
  title: string;
  source?: string; // e.g. "רבקל'ה", "פרומה ז\"ל", "גיטה כהן"
  category: RecipeCategory;
  yieldText?: string; // e.g. "2 תבניות אינגליש קייק", "כ-40 יחידות"
  ovenTemp?: string; // e.g. "180 מעלות"
  prepNote?: string; // Opening note or context
  ingredientGroups: IngredientGroup[];
  steps: RecipeStep[];
  tips?: string[];
}

export interface ActiveTimer {
  id: string;
  recipeId: string;
  recipeTitle: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isCompleted: boolean;
}

export type UnitDisplayMode = 'original' | 'metric';
export type MargarineSubMode = 'original' | 'butter' | 'oil';
