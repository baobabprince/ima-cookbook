import React, { useState } from 'react';
import { Calculator, Scale, X } from 'lucide-react';
import { formatFraction, MOMS_NOTEBOOK_CONVERSIONS, PAN_CONVERSIONS } from '../utils/conversions';

interface ConversionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScaleFactor?: (factor: number) => void;
}

interface CalcIngredientOption {
  label: string;
  gramsPerCup: number;
  gramsPerTbsp: number;
  gramsPerTsp: number;
  isLiquid?: boolean;
}

const CALC_INGREDIENTS: CalcIngredientOption[] = [
  { label: 'קמח לבן / רגיל / תופח', gramsPerCup: 140, gramsPerTbsp: 10, gramsPerTsp: 3.3 },
  { label: 'קמח מלא / כוסמין מלא', gramsPerCup: 130, gramsPerTbsp: 8.5, gramsPerTsp: 3 },
  { label: 'סוכר לבן', gramsPerCup: 200, gramsPerTbsp: 12, gramsPerTsp: 4 },
  { label: 'סוכר חום כהה (דחוס)', gramsPerCup: 220, gramsPerTbsp: 14, gramsPerTsp: 4.5 },
  { label: 'אבקת סוכר', gramsPerCup: 120, gramsPerTbsp: 8, gramsPerTsp: 2.5 },
  { label: 'קקאו / קורנפלור / פודינג', gramsPerCup: 140, gramsPerTbsp: 10, gramsPerTsp: 3.5 },
  { label: 'שמרים יבשים (לפי הטבלה של אמא)', gramsPerCup: 136, gramsPerTbsp: 8.5, gramsPerTsp: 3 },
  { label: 'שמן קנולה / זית', gramsPerCup: 200, gramsPerTbsp: 14, gramsPerTsp: 4.5, isLiquid: true },
  { label: 'מים / חלב / מיץ תפוזים / שמנת', gramsPerCup: 240, gramsPerTbsp: 15, gramsPerTsp: 5, isLiquid: true },
  { label: 'חמאה / מרגרינה', gramsPerCup: 240, gramsPerTbsp: 15, gramsPerTsp: 5 },
  { label: 'דבש / סילאן / טחינה / ממרח', gramsPerCup: 320, gramsPerTbsp: 20, gramsPerTsp: 7 },
  { label: 'אגוזים / שקדים / שומשום / קוואקר', gramsPerCup: 105, gramsPerTbsp: 7.5, gramsPerTsp: 2.5 },
];

export const ConversionCalculatorModal: React.FC<ConversionCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyScaleFactor,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [inputAmount, setInputAmount] = useState<string>('1');
  const [inputUnit, setInputUnit] = useState<'cup' | 'tbsp' | 'tsp' | 'gram'>('cup');
  const [fromPan, setFromPan] = useState('round-24');
  const [toPan, setToPan] = useState('round-26');

  if (!isOpen) return null;

  const selectedIng = CALC_INGREDIENTS[selectedIdx];
  const numericVal = parseFloat(inputAmount) || 0;

  let totalGrams = 0;
  if (inputUnit === 'cup') totalGrams = numericVal * selectedIng.gramsPerCup;
  else if (inputUnit === 'tbsp') totalGrams = numericVal * selectedIng.gramsPerTbsp;
  else if (inputUnit === 'tsp') totalGrams = numericVal * selectedIng.gramsPerTsp;
  else totalGrams = numericVal;

  const equivCups = totalGrams / selectedIng.gramsPerCup;
  const equivTbsp = totalGrams / selectedIng.gramsPerTbsp;
  const equivMl = selectedIng.isLiquid ? Math.round(equivCups * 240) : Math.round(equivCups * 240);

  const fromPanObj = PAN_CONVERSIONS.find((p) => p.id === fromPan) || PAN_CONVERSIONS[1];
  const toPanObj = PAN_CONVERSIONS.find((p) => p.id === toPan) || PAN_CONVERSIONS[2];
  const panRatio = Math.round((toPanObj.factor / fromPanObj.factor) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E7E2DA]">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-[#78350F]" />
            <h2 className="text-xl font-bold font-serif-hebrew text-stone-900">
              טבלת המרת היחידות של אמא ומחשבון אפייה
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
          {/* Mom's Original Opening Table */}
          <section>
            <h3 className="text-base font-bold font-serif-hebrew text-stone-900 mb-3">
              01. המרת יחידות (הפתיחה המקורית ממחברת המתכונים של אמא)
            </h3>
            <div className="bg-white border border-[#E7E2DA] rounded-lg divide-y divide-[#E7E2DA]">
              {MOMS_NOTEBOOK_CONVERSIONS.map((row, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-semibold text-stone-900">{row.title}</span>
                    <span className="mx-2 text-[#78350F] font-bold">=</span>
                    <span className="font-semibold text-[#78350F]">{row.equivalent}</span>
                  </div>
                  {row.note && <span className="text-xs text-stone-500">{row.note}</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Interactive Ingredient Calculator */}
          <section>
            <h3 className="text-base font-bold font-serif-hebrew text-stone-900 mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#78350F]" />
              02. מחשבון המרת מידות ומשקלים חכם
            </h3>
            <div className="bg-white border border-[#E7E2DA] rounded-lg p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">בחר מצרך</label>
                  <select
                    value={selectedIdx}
                    onChange={(e) => setSelectedIdx(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#78350F]"
                  >
                    {CALC_INGREDIENTS.map((ing, i) => (
                      <option key={i} value={i}>
                        {ing.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">כמות</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-tabular bg-[#FBF9F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#78350F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">יחידת מידה</label>
                  <select
                    value={inputUnit}
                    onChange={(e) => setInputUnit(e.target.value as 'cup' | 'tbsp' | 'tsp' | 'gram')}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#78350F]"
                  >
                    <option value="cup">כוסות (240 מ"ל)</option>
                    <option value="tbsp">כפות</option>
                    <option value="tsp">כפיות</option>
                    <option value="gram">גרמים</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
                <div className="p-3 bg-[#FBF9F5] rounded-lg border border-stone-200/80">
                  <div className="text-xs text-stone-500">משקל בגרמים</div>
                  <div className="text-lg font-bold font-mono-tabular text-stone-900 mt-0.5">
                    {Math.round(totalGrams)} גרם
                  </div>
                </div>
                <div className="p-3 bg-[#FBF9F5] rounded-lg border border-stone-200/80">
                  <div className="text-xs text-stone-500">בכוסות מדידה</div>
                  <div className="text-lg font-bold font-mono-tabular text-stone-900 mt-0.5">
                    {formatFraction(equivCups) || '0'} כוסות
                  </div>
                </div>
                <div className="p-3 bg-[#FBF9F5] rounded-lg border border-stone-200/80">
                  <div className="text-xs text-stone-500">בכפות</div>
                  <div className="text-lg font-bold font-mono-tabular text-stone-900 mt-0.5">
                    {Math.round(equivTbsp * 10) / 10} כפות
                  </div>
                </div>
                <div className="p-3 bg-[#FBF9F5] rounded-lg border border-stone-200/80">
                  <div className="text-xs text-stone-500">נפח במיליליטר</div>
                  <div className="text-lg font-bold font-mono-tabular text-stone-900 mt-0.5">
                    {equivMl} מ"ל
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pan Size Converter */}
          <section>
            <h3 className="text-base font-bold font-serif-hebrew text-stone-900 mb-3">
              03. התאמת כמויות בין גדלי תבניות
            </h3>
            <div className="bg-white border border-[#E7E2DA] rounded-lg p-5 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-stone-600 mb-1">תבנית במקור</label>
                <select
                  value={fromPan}
                  onChange={(e) => setFromPan(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg"
                >
                  {PAN_CONVERSIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-stone-600 mb-1">תבנית רצויה</label>
                <select
                  value={toPan}
                  onChange={(e) => setToPan(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg"
                >
                  {PAN_CONVERSIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-stone-100 rounded-lg text-center">
                  <span className="block text-xs text-stone-500">יחס הכפלה</span>
                  <span className="font-mono-tabular font-bold text-stone-900">x{panRatio}</span>
                </div>
                {onApplyScaleFactor && (
                  <button
                    onClick={() => {
                      onApplyScaleFactor(panRatio);
                      onClose();
                    }}
                    className="px-4 py-2.5 bg-[#78350F] text-white text-xs font-medium rounded-lg hover:bg-[#5c280b] transition-colors whitespace-nowrap"
                  >
                    החל על המתכון הפעיל
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
