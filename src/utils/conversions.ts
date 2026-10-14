import { IngredientItem, MargarineSubMode, UnitDisplayMode } from '../types/recipe';

export interface ConversionReferenceRow {
  title: string;
  equivalent: string;
  note?: string;
}

/**
 * הטבלה הפותחת את מחברת המתכונים של אמא (עמוד ראשון במקור)
 */
export const MOMS_NOTEBOOK_CONVERSIONS: ConversionReferenceRow[] = [
  {
    title: '50 גרם שמרים טריים (קובייה/שמרית)',
    equivalent: '2 כפות שמרים יבשים (כ-17 גרם)',
    note: 'יחס המרה לקילוגרם קמח',
  },
  {
    title: '1 כף שמרים יבשים',
    equivalent: '8.5 גרם (או 25 גרם שמרים טריים)',
    note: 'מדוד בכף מדידה סטנדרטית',
  },
  {
    title: '1 חבילת מרגרינה / מחמאה (200 גרם)',
    equivalent: '¾ כוס שמן (180 מ"ל) או 200 גרם חמאה',
    note: 'בעוגות בחושות ובצקים ניתן להמיר לשמן או לחמאה לפי הצורך',
  },
  {
    title: '1 ק"ג קמח לבן',
    equivalent: '7 כוסות קמח לבן = 7–8 כוסות קמח מלא',
    note: 'כוס קמח לבן = 140 גרם | כוס קמח מלא = כ-125–135 גרם',
  },
];

export interface IngredientDensity {
  keywords: string[];
  gramsPerCup?: number;
  mlPerCup?: number;
  gramsPerTbsp?: number;
  gramsPerTsp?: number;
  gramsPerUnit?: number;
}

export const INGREDIENT_CONVERSION_MAP: IngredientDensity[] = [
  { keywords: ['קמח מלא', 'קמח כוסמין מלא', 'קמח שיפון'], gramsPerCup: 130, gramsPerTbsp: 8.5 },
  { keywords: ['קמח', 'קמח לבן', 'קמח רגיל', 'קמח תופח', 'קמח אוסם', 'קמח כוסמין'], gramsPerCup: 140, gramsPerTbsp: 10 },
  { keywords: ['סוכר חום'], gramsPerCup: 220, gramsPerTbsp: 14, gramsPerTsp: 4.5 },
  { keywords: ['אבקת סוכר'], gramsPerCup: 120, gramsPerTbsp: 8, gramsPerTsp: 2.5 },
  { keywords: ['סוכר'], gramsPerCup: 200, gramsPerTbsp: 12, gramsPerTsp: 4 },
  { keywords: ['שמן', 'שמן זית'], gramsPerCup: 200, mlPerCup: 240, gramsPerTbsp: 14 },
  { keywords: ['מים', 'חלב', 'חלב סויה', 'חלב שקדים', 'מיץ תפוזים', 'מיץ ענבים', 'יין', 'ריויון', 'ריוויון', 'שמנת מתוקה', 'אספרסו', 'תה'], mlPerCup: 240, gramsPerTbsp: 15 },
  { keywords: ['שמרים'], gramsPerTbsp: 8.5, gramsPerTsp: 3 },
  { keywords: ['קקאו', 'שוקולית', 'קורנפלור', 'פודינג', 'אינסטנט פודינג'], gramsPerCup: 140, gramsPerTbsp: 10, gramsPerTsp: 3.5 },
  { keywords: ['דבש', 'סילאן', 'מייפל', 'טחינה', 'חמאת בוטנים', 'נוטלה', 'ממרח לוטוס', 'ממרח תמרים', 'ריבת חלב', 'ריבה'], gramsPerCup: 320, gramsPerTbsp: 20, gramsPerTsp: 7 },
  { keywords: ['קוואקר', 'שיבולת שועל', 'פצפוצי אורז', 'קוקוס'], gramsPerCup: 100, gramsPerTbsp: 7 },
  { keywords: ['אגוזים', 'אגוזי מלך', 'פקאן', 'שקדים', 'בוטנים', 'פיסטוק', 'שומשום', 'גרעיני חמניה'], gramsPerCup: 110, gramsPerTbsp: 8 },
  { keywords: ['סולת'], gramsPerCup: 170, gramsPerTbsp: 11 },
  { keywords: ['מלח'], gramsPerTbsp: 18, gramsPerTsp: 6 },
  { keywords: ['אבקת אפייה', 'אבקת אפיה', 'סודה לשתייה', 'סודה לשתיה'], gramsPerUnit: 10, gramsPerTbsp: 10, gramsPerTsp: 4 },
  { keywords: ['סוכר וניל'], gramsPerUnit: 10, gramsPerTbsp: 10 },
];

export const PAN_CONVERSIONS = [
  { id: 'round-22', label: 'תבנית עגולה 22 ס"מ', factor: 0.75 },
  { id: 'round-24', label: 'תבנית עגולה 24 ס"מ (או 2 אינגליש קייק)', factor: 1.0 },
  { id: 'round-26', label: 'תבנית עגולה 26 ס"מ (או מלבנית בינונית)', factor: 1.2 },
  { id: 'round-28', label: 'תבנית עגולה 28 ס"מ (או תבנית תנור גדולה)', factor: 1.4 },
  { id: 'english-1', label: 'תבנית אינגליש קייק אחת', factor: 0.5 },
  { id: 'english-3', label: '3 תבניות אינגליש קייק', factor: 1.5 },
];

export function formatFraction(val: number): string {
  if (!Number.isFinite(val) || val <= 0) return '';
  const rounded = Math.round(val * 100) / 100;
  const whole = Math.floor(rounded);
  const rem = rounded - whole;

  const fractions: Array<{ dec: number; sym: string }> = [
    { dec: 0, sym: '' },
    { dec: 0.125, sym: '⅛' },
    { dec: 0.25, sym: '¼' },
    { dec: 0.33, sym: '⅓' },
    { dec: 0.375, sym: '⅜' },
    { dec: 0.5, sym: '½' },
    { dec: 0.67, sym: '⅔' },
    { dec: 0.75, sym: '¾' },
    { dec: 1, sym: '' },
  ];

  let closest = fractions[0];
  let minDiff = Math.abs(rem - fractions[0].dec);
  for (const f of fractions) {
    const diff = Math.abs(rem - f.dec);
    if (diff < minDiff) {
      minDiff = diff;
      closest = f;
    }
  }

  if (minDiff <= 0.06) {
    if (closest.dec === 1) {
      return String(whole + 1);
    }
    if (whole === 0) {
      return closest.sym || String(rounded);
    }
    return closest.sym ? `${whole} ו-${closest.sym}` : String(whole);
  }

  return Number(rounded.toFixed(1)).toString();
}

function findDensity(itemName: string): IngredientDensity | undefined {
  const lower = itemName.trim();
  return INGREDIENT_CONVERSION_MAP.find((d) =>
    d.keywords.some((k) => lower.includes(k))
  );
}

export interface FormattedIngredientResult {
  displayAmount: string;
  displayUnit: string;
  displayItem: string;
  displayNote?: string;
  metricHint?: string;
}

export function formatIngredient(
  ing: IngredientItem,
  scaleFactor: number,
  unitMode: UnitDisplayMode,
  margarineMode: MargarineSubMode
): FormattedIngredientResult {
  let amount = ing.amount !== undefined ? ing.amount * scaleFactor : undefined;
  let amountMax = ing.amountMax !== undefined ? ing.amountMax * scaleFactor : undefined;
  let unit = ing.unit || '';
  let item = ing.item;
  let note = ing.note;

  // Handle Margarine substitution based on Mom's table (1 חבילת מרגרינה 200 גרם = 3/4 כוס שמן או 200 גרם חמאה)
  const isMargarine =
    item.includes('מרגרינה') || item.includes('מחמאה') || item.includes('מזולה') || item.includes('בלובנד');

  if (isMargarine && margarineMode !== 'original') {
    if (margarineMode === 'butter') {
      item = item
        .replace(/מרגרינה בטעם חמאה/g, 'חמאה')
        .replace(/מרגרינה/g, 'חמאה')
        .replace(/מחמאה/g, 'חמאה')
        .replace(/מזולה/g, 'חמאה')
        .replace(/בלובנד/g, 'חמאה');
    } else if (margarineMode === 'oil') {
      // Convert margarine packages or grams to oil
      let packs = 0;
      if (unit === 'גרם' || unit === "גר'") {
        packs = (amount || 200) / 200;
      } else if (unit.includes('חב') || unit === '' || unit === 'יח') {
        packs = amount || 1;
      }
      if (packs > 0) {
        const oilCups = packs * 0.75;
        const oilMl = Math.round(oilCups * 240);
        if (unitMode === 'metric') {
          return {
            displayAmount: String(oilMl),
            displayUnit: 'מ"ל',
            displayItem: 'שמן קנולה (במקום מרגרינה)',
            displayNote: note,
          };
        }
        return {
          displayAmount: formatFraction(oilCups),
          displayUnit: oilCups === 1 ? 'כוס' : 'כוסות',
          displayItem: 'שמן (מומר ממרגרינה לפי ¾ כוס לחבילה)',
          displayNote: note,
        };
      }
    }
  }

  // Format base amount string
  let displayAmount = '';
  if (amount !== undefined) {
    if (amountMax !== undefined) {
      displayAmount = `${formatFraction(amount)}–${formatFraction(amountMax)}`;
    } else {
      displayAmount = formatFraction(amount);
    }
  }

  // Calculate metric conversion if applicable
  let metricHint: string | undefined;
  const density = findDensity(item);

  if (amount !== undefined) {
    const u = unit.trim();
    const isCup = u === 'כוס' || u === 'כוסות';
    const isTbsp = u === 'כף' || u === 'כפות' || u === 'כף שטוחה' || u === 'כף גדושה';
    const isTsp = u === 'כפית' || u === 'כפיות';
    const isKg = u === 'ק"ג' || u === 'קג';
    const isPack = u === 'שקית' || u === 'שקיות' || u === 'חבילה' || u === 'חבילות' || u === "חב'";

    if (isCup && density) {
      if (density.mlPerCup) {
        const ml = Math.round(amount * density.mlPerCup);
        metricHint = `${ml} מ"ל`;
      } else if (density.gramsPerCup) {
        const g = Math.round(amount * density.gramsPerCup);
        metricHint = `${g} גרם`;
      }
    } else if (isTbsp && density?.gramsPerTbsp) {
      const g = Math.round(amount * density.gramsPerTbsp * 10) / 10;
      metricHint = `${g} גרם`;
    } else if (isTsp && density?.gramsPerTsp) {
      const g = Math.round(amount * density.gramsPerTsp * 10) / 10;
      metricHint = `${g} גרם`;
    } else if (isKg) {
      const g = Math.round(amount * 1000);
      metricHint = `${g} גרם`;
    } else if ((isPack || u === '') && isMargarine) {
      const g = Math.round(amount * 200);
      metricHint = `${g} גרם`;
    }
  }

  if (unitMode === 'metric' && metricHint) {
    return {
      displayAmount: metricHint,
      displayUnit: '',
      displayItem: item,
      displayNote: displayAmount ? `(במקור: ${displayAmount} ${unit})${note ? ` · ${note}` : ''}` : note,
    };
  }

  return {
    displayAmount,
    displayUnit: unit,
    displayItem: item,
    displayNote: note,
    metricHint,
  };
}
