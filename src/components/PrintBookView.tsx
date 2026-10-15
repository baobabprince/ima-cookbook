import React from 'react';
import { ArrowRight, FileText, Printer } from 'lucide-react';
import { Recipe } from '../types/recipe';
import { formatIngredient, MOMS_NOTEBOOK_CONVERSIONS } from '../utils/conversions';

interface PrintBookViewProps {
  recipes: Recipe[];
  onExitPrintView: () => void;
  onExportWord: () => void;
  onEditRecipe: (recipe: Recipe) => void;
}

export const PrintBookView: React.FC<PrintBookViewProps> = ({
  recipes,
  onExitPrintView,
  onExportWord,
  onEditRecipe,
}) => {
  const sortedRecipes = [...recipes].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="min-h-screen bg-[#FBF9F5] print:bg-white text-[#1C1917]">
      {/* Non-printing action bar */}
      <div className="no-print sticky top-0 z-30 bg-[#1C1917] text-[#FBF9F5] px-6 py-3.5 border-b border-stone-800 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onExitPrintView}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה לאתר האינטראקטיבי
            </button>
            <span className="text-xs text-stone-300 hidden sm:inline">
              תצוגת ספר מלאה להדפסה כמתנה ({sortedRecipes.length} מתכונים בסדר המקורי) · ניתן ללחוץ על כל מתכון לעריכה
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExportWord}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-600 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              הורד קובץ Word (.docx)
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2 text-xs font-medium bg-[#78350F] hover:bg-[#9A3412] text-white rounded-lg shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              הדפס / שמור כ-PDF מעוצב
            </button>
          </div>
        </div>
      </div>

      {/* Book Container */}
      <div className="max-w-2xl mx-auto px-4 py-8 print:p-0 print:max-w-none space-y-8 print:space-y-0">
        {/* Page 1: Classic Book Cover */}
        <section className="print-page-break bg-white border-2 border-[#D6CEBE] p-10 sm:p-16 print:p-6 text-center relative shadow-sm print:shadow-none min-h-[75vh] print:min-h-screen flex flex-col justify-between print:justify-center">
          <div className="border border-[#E7E2DA] p-8 sm:p-14 print:p-8 flex-1 flex flex-col items-center justify-center">
            <div className="text-xs tracking-[0.25em] text-stone-500 uppercase mb-6">
              מהדורת מתנה משפחתית
            </div>

            {/* Classic Ornamental Flourish */}
            <svg className="w-28 h-6 text-[#78350F]/70 mb-6" viewBox="0 0 120 24" fill="none">
              <path
                d="M10 12H45M75 12H110M60 4L66 12L60 20L54 12L60 4Z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle cx="48" cy="12" r="2" fill="currentColor" />
              <circle cx="72" cy="12" r="2" fill="currentColor" />
            </svg>

            <h1 className="text-5xl sm:text-6xl print:text-4xl font-bold font-serif-hebrew text-stone-900 tracking-tight mb-4">
              המטבח של אמא
            </h1>

            <p className="text-lg sm:text-xl print:text-base font-serif-hebrew text-stone-600 max-w-md mx-auto leading-relaxed mt-2">
              אוסף המתכונים השלם — לחמים, חלות, עוגות שוקולד, עוגות גבינה, עוגיות ומאפים מלוחים
            </p>

            <svg className="w-28 h-6 text-[#78350F]/70 mt-8" viewBox="0 0 120 24" fill="none">
              <path
                d="M10 12H45M75 12H110M60 4L66 12L60 20L54 12L60 4Z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>

            <div className="mt-14 pt-6 print:mt-8 print:pt-4 border-t border-[#E7E2DA] text-xs text-stone-500 font-mono-tabular">
              {sortedRecipes.length} מתכונים ערוכים לפי הסדר המקורי במחברת
            </div>
          </div>
        </section>

        {/* Page 2: Mom's Unit Conversion Table */}
        <section className="print-page-break bg-white border border-[#D6CEBE] p-8 sm:p-12 print:p-6 shadow-sm print:shadow-none print:min-h-screen print:flex print:flex-col print:justify-center">
          <div className="text-center border-b border-[#E7E2DA] pb-6 print:pb-3 mb-8 print:mb-4">
            <div className="text-xs text-[#78350F] font-medium mb-1">עמוד פתיחה</div>
            <h2 className="text-3xl print:text-2xl font-bold font-serif-hebrew text-stone-900">
              המרת יחידות ומידות אפייה
            </h2>
          </div>

          <div className="divide-y divide-[#E7E2DA] border border-[#E7E2DA] rounded-lg overflow-hidden mb-8 print:mb-4">
            {MOMS_NOTEBOOK_CONVERSIONS.map((row, idx) => (
              <div key={idx} className="p-4 print:p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FBF9F5]/60">
                <div className="text-base print:text-xs">
                  <span className="font-bold text-stone-900">{row.title}</span>
                  <span className="mx-3 print:mx-1 text-[#78350F] font-bold">=</span>
                  <span className="font-bold text-[#78350F]">{row.equivalent}</span>
                </div>
                {row.note && <span className="text-xs print:text-[10px] text-stone-500">{row.note}</span>}
              </div>
            ))}
          </div>

          <h3 className="text-lg print:text-sm font-bold font-serif-hebrew text-stone-900 mb-3 print:mb-2">
            מידות כוס וסטנדרטים שימושיים במטבח (כוס = 240 מ"ל)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:gap-1.5 text-xs print:text-[10px] text-stone-700">
            <div className="p-3 print:p-1.5 border border-[#E7E2DA] rounded">
              <strong className="block text-stone-900">1 כוס קמח לבן / תופח</strong>
              140 גרם (כף = 10 גרם)
            </div>
            <div className="p-3 print:p-1.5 border border-[#E7E2DA] rounded">
              <strong className="block text-stone-900">1 כוס קמח מלא</strong>
              125–130 גרם
            </div>
            <div className="p-3 print:p-1.5 border border-[#E7E2DA] rounded">
              <strong className="block text-stone-900">1 כוס סוכר לבן</strong>
              200 גרם (כף = 12 גרם)
            </div>
            <div className="p-3 print:p-1.5 border border-[#E7E2DA] rounded">
              <strong className="block text-stone-900">1 כוס סוכר חום דחוס</strong>
              220 גרם
            </div>
            <div className="p-3 print:p-1.5 border border-[#E7E2DA] rounded">
              <strong className="block text-stone-900">1 כוס אבקת סוכר</strong>
              120 גרם
            </div>
            <div className="p-3 print:p-1.5 border border-[#E7E2DA] rounded">
              <strong className="block text-stone-900">1 כוס קקאו / קורנפלור</strong>
              140 גרם (כף = 10 גרם)
            </div>
            <div className="p-3 print:p-1.5 border border-[#E7E2DA] rounded">
              <strong className="block text-stone-900">1 כוס שמן</strong>
              200 גרם / 240 מ"ל
            </div>
            <div className="p-3 print:p-1.5 border border-[#E7E2DA] rounded">
              <strong className="block text-stone-900">1 חבילת חמאה / מרגרינה</strong>
              200 גרם (או ¾ כוס שמן)
            </div>
            <div className="p-3 print:p-1.5 border border-[#E7E2DA] rounded">
              <strong className="block text-stone-900">1 שקית אבקת אפייה / וניל</strong>
              10 גרם (כף שטוחה / 2 כפיות)
            </div>
          </div>
        </section>

        {/* Page 3: Numbered Table of Contents */}
        <section className="print-page-break bg-white border border-[#D6CEBE] p-8 sm:p-12 print:p-6 shadow-sm print:shadow-none">
          <div className="text-center border-b border-[#E7E2DA] pb-5 print:pb-3 mb-6 print:mb-3">
            <h2 className="text-3xl print:text-2xl font-bold font-serif-hebrew text-stone-900">
              תוכן העניינים (לפי סדר הופעת המתכונים)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 gap-x-6 gap-y-1 text-xs print:text-[10px]">
            {sortedRecipes.map((r) => (
              <a
                key={r.id}
                href={`#print-recipe-${r.orderIndex}`}
                className="flex items-baseline justify-between py-0.5 border-b border-dotted border-stone-200 hover:text-[#78350F] transition-colors"
              >
                <span className="truncate pl-2">
                  <strong className="font-mono-tabular text-[#78350F] ml-1.5">{r.orderIndex}.</strong>
                  {r.title}
                </span>
                {r.source && (
                  <span className="text-[10px] print:text-[9px] text-stone-400 shrink-0 truncate max-w-[90px]">
                    {r.source}
                  </span>
                )}
              </a>
            ))}
          </div>
        </section>

        {/* Recipes List - Each recipe strictly in recipe-print-page container */}
        <div className="space-y-8 print:space-y-0">
          {sortedRecipes.map((recipe) => (
            <article
              key={recipe.id}
              id={`print-recipe-${recipe.orderIndex}`}
              className="recipe-print-page bg-white border border-[#D6CEBE] rounded-lg p-6 sm:p-8 print:p-3 shadow-xs print:shadow-none relative group"
            >
              {/* Edit button in preview */}
              <button
                onClick={() => onEditRecipe(recipe)}
                className="no-print absolute top-4 left-4 opacity-0 group-hover:opacity-100 px-3 py-1 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded transition-opacity"
              >
                עריכת מתכון
              </button>

              {/* Header */}
              <header className="border-b border-[#E7E2DA] pb-2 print:pb-1.5 mb-3 print:mb-2 shrink-0">
                <div className="flex flex-wrap items-center gap-2 print:gap-1.5 text-xs print:text-[10px] text-stone-500 mb-1 print:mb-0.5">
                  <span className="font-mono-tabular font-bold text-[#78350F]">
                    מתכון #{recipe.orderIndex}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{recipe.category}</span>
                  {recipe.source && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-stone-700">{recipe.source}</span>
                    </>
                  )}
                  {recipe.yieldText && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{recipe.yieldText}</span>
                    </>
                  )}
                  {recipe.ovenTemp && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>חום תנור: {recipe.ovenTemp}</span>
                    </>
                  )}
                </div>

                <h3 className="text-2xl print:text-lg font-bold font-serif-hebrew text-stone-900 leading-tight">
                  {recipe.orderIndex}. {recipe.title}
                </h3>

                {recipe.prepNote && (
                  <p className="text-xs print:text-[10px] text-stone-600 italic mt-1 print:mt-0.5">{recipe.prepNote}</p>
                )}
              </header>

              {/* 2-Column Body: Ingredients & Steps */}
              <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-6 print:gap-3 flex-1 min-h-0 overflow-hidden">
                {/* Ingredients Column */}
                <div className="md:col-span-5 print:col-span-5 bg-[#FBF9F5] p-4 print:p-2 rounded border border-[#E7E2DA]/80 overflow-hidden flex flex-col">
                  <h4 className="text-sm print:text-xs font-bold font-serif-hebrew text-stone-900 mb-2 print:mb-1 border-b border-[#E7E2DA] pb-1 shrink-0">
                    מצרכים
                  </h4>
                  <div className="space-y-2 print:space-y-1 overflow-hidden">
                    {recipe.ingredientGroups.map((group, gIdx) => (
                      <div key={gIdx}>
                        {group.groupTitle && (
                          <div className="text-xs print:text-[10px] font-bold text-[#78350F] mb-0.5">
                            {group.groupTitle}:
                          </div>
                        )}
                        <ul className="space-y-1 print:space-y-0.5 text-xs print:text-[10px] text-stone-800">
                          {group.items.map((ing, iIdx) => {
                            const f = formatIngredient(ing, 1, 'original', 'original');
                            return (
                              <li key={iIdx} className="flex items-baseline gap-1 leading-tight">
                                <span className="text-[#78350F] text-[8px] shrink-0">●</span>
                                <span>
                                  {f.displayAmount && (
                                    <strong className="font-mono-tabular ml-0.5">{f.displayAmount}</strong>
                                  )}
                                  {f.displayUnit && <strong className="ml-0.5">{f.displayUnit}</strong>}
                                  <span>{f.displayItem}</span>
                                  {f.displayNote && (
                                    <span className="text-stone-500 mr-0.5">({f.displayNote})</span>
                                  )}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions Column */}
                <div className="md:col-span-7 print:col-span-7 flex flex-col justify-between overflow-hidden">
                  <div className="overflow-hidden flex flex-col">
                    <h4 className="text-sm print:text-xs font-bold font-serif-hebrew text-stone-900 mb-2 print:mb-1 border-b border-[#E7E2DA] pb-1 shrink-0">
                      אופן ההכנה
                    </h4>
                    <ol className="space-y-1.5 print:space-y-1 text-xs print:text-[10px] sm:text-sm text-stone-800 leading-snug print:leading-tight overflow-hidden">
                      {recipe.steps.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-baseline gap-1.5">
                          <span className="font-mono-tabular font-bold text-[#78350F] shrink-0">
                            {sIdx + 1}.
                          </span>
                          <span>{step.text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {recipe.tips && recipe.tips.length > 0 && (
                    <div className="mt-2 print:mt-1 pt-1.5 print:pt-1 border-t border-dashed border-[#E7E2DA] text-xs print:text-[10px] text-stone-600 shrink-0">
                      {recipe.tips.map((tip, tIdx) => (
                        <p key={tIdx} className="leading-tight">
                          <strong className="text-stone-800">הערה: </strong>
                          {tip}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
