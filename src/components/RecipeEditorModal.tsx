import React, { useState } from 'react';
import { Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { IngredientGroup, Recipe, RecipeCategory, RecipeStep } from '../types/recipe';
import { RECIPE_CATEGORIES } from '../data/allRecipes';

interface RecipeEditorModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Recipe) => void;
  onResetToOriginal?: (recipeId: string) => void;
  hasOriginalVersion?: boolean;
}

export const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onSave,
  onResetToOriginal,
  hasOriginalVersion,
}) => {
  const [formData, setFormData] = useState<Recipe | null>(recipe ? JSON.parse(JSON.stringify(recipe)) : null);

  React.useEffect(() => {
    if (recipe) {
      setFormData(JSON.parse(JSON.stringify(recipe)));
    }
  }, [recipe]);

  if (!isOpen || !formData) return null;

  const handleGroupTitleChange = (gIdx: number, val: string) => {
    const groups = [...formData.ingredientGroups];
    groups[gIdx] = { ...groups[gIdx], groupTitle: val || undefined };
    setFormData({ ...formData, ingredientGroups: groups });
  };

  const handleIngredientChange = (
    gIdx: number,
    iIdx: number,
    field: 'amount' | 'unit' | 'item' | 'note',
    val: string
  ) => {
    const groups = [...formData.ingredientGroups];
    const items = [...groups[gIdx].items];
    const current = { ...items[iIdx] };

    if (field === 'amount') {
      const parsed = parseFloat(val);
      current.amount = Number.isNaN(parsed) ? undefined : parsed;
    } else if (field === 'unit') {
      current.unit = val || undefined;
    } else if (field === 'item') {
      current.item = val;
    } else if (field === 'note') {
      current.note = val || undefined;
    }

    items[iIdx] = current;
    groups[gIdx] = { ...groups[gIdx], items };
    setFormData({ ...formData, ingredientGroups: groups });
  };

  const handleAddIngredient = (gIdx: number) => {
    const groups = [...formData.ingredientGroups];
    groups[gIdx] = {
      ...groups[gIdx],
      items: [...groups[gIdx].items, { amount: 1, unit: 'כוס', item: '' }],
    };
    setFormData({ ...formData, ingredientGroups: groups });
  };

  const handleRemoveIngredient = (gIdx: number, iIdx: number) => {
    const groups = [...formData.ingredientGroups];
    groups[gIdx] = {
      ...groups[gIdx],
      items: groups[gIdx].items.filter((_, idx) => idx !== iIdx),
    };
    setFormData({ ...formData, ingredientGroups: groups });
  };

  const handleAddGroup = () => {
    const groups: IngredientGroup[] = [
      ...formData.ingredientGroups,
      { groupTitle: 'קבוצת מצרכים חדשה', items: [{ amount: 1, unit: 'כוס', item: '' }] },
    ];
    setFormData({ ...formData, ingredientGroups: groups });
  };

  const handleRemoveGroup = (gIdx: number) => {
    if (formData.ingredientGroups.length <= 1) return;
    setFormData({
      ...formData,
      ingredientGroups: formData.ingredientGroups.filter((_, idx) => idx !== gIdx),
    });
  };

  const handleStepChange = (sIdx: number, field: keyof RecipeStep, val: string) => {
    const steps = [...formData.steps];
    const current = { ...steps[sIdx] };
    if (field === 'timerMinutes') {
      const parsed = parseInt(val, 10);
      current.timerMinutes = Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
    } else if (field === 'text') {
      current.text = val;
    } else if (field === 'timerLabel') {
      current.timerLabel = val || undefined;
    }
    steps[sIdx] = current;
    setFormData({ ...formData, steps });
  };

  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { text: '' }],
    });
  };

  const handleRemoveStep = (sIdx: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, idx) => idx !== sIdx),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E7E2DA]">
          <div>
            <h2 className="text-xl font-bold font-serif-hebrew text-stone-900">
              עריכת מתכון #{formData.orderIndex}: {formData.title}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              כל שינוי נשמר אוטומטית ויתעדכן מיד גם בייצוא לקובץ Word ולמהדורת ה-PDF.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Basic Details */}
          <div className="bg-white p-5 rounded-lg border border-[#E7E2DA] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-600 mb-1">שם המתכון</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#78350F]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">פרק / קטגוריה</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as RecipeCategory })}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#78350F]"
              >
                {RECIPE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">מקור המתכון / קרדיט</label>
              <input
                type="text"
                value={formData.source || ''}
                onChange={(e) => setFormData({ ...formData, source: e.target.value || undefined })}
                placeholder="למשל: רבקל׳ה, עמליה, גיטה כהן..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#78350F]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">תבנית / כמות מנות</label>
              <input
                type="text"
                value={formData.yieldText || ''}
                onChange={(e) => setFormData({ ...formData, yieldText: e.target.value || undefined })}
                placeholder="למשל: 2 תבניות אינגליש קייק"
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#78350F]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">חום תנור</label>
              <input
                type="text"
                value={formData.ovenTemp || ''}
                onChange={(e) => setFormData({ ...formData, ovenTemp: e.target.value || undefined })}
                placeholder="למשל: 180 מעלות"
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#78350F]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-600 mb-1">הערת פתיחה למתכון (אופציונלי)</label>
              <input
                type="text"
                value={formData.prepNote || ''}
                onChange={(e) => setFormData({ ...formData, prepNote: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#78350F]"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white p-5 rounded-lg border border-[#E7E2DA] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-serif-hebrew text-stone-900">מצרכים</h3>
              <button
                type="button"
                onClick={handleAddGroup}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#78350F] bg-amber-50/80 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                הוסף קבוצת מצרכים (בצק / מילוי / ציפוי)
              </button>
            </div>

            {formData.ingredientGroups.map((group, gIdx) => (
              <div key={gIdx} className="p-4 bg-[#FBF9F5] rounded-lg border border-stone-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={group.groupTitle || ''}
                    onChange={(e) => handleGroupTitleChange(gIdx, e.target.value)}
                    placeholder="כותרת קבוצה (אופציונלי, למשל: לבצק / לציפוי)"
                    className="flex-1 px-3 py-1.5 text-xs font-semibold bg-white border border-stone-300 rounded-md"
                  />
                  {formData.ingredientGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(gIdx)}
                      className="text-xs text-red-600 hover:underline px-2"
                    >
                      מחק קבוצה
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {group.items.map((ing, iIdx) => (
                    <div key={iIdx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="number"
                        step="any"
                        placeholder="כמות"
                        value={ing.amount !== undefined ? ing.amount : ''}
                        onChange={(e) => handleIngredientChange(gIdx, iIdx, 'amount', e.target.value)}
                        className="col-span-2 px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-stone-300 rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="יחידה (כוס/כף/גרם)"
                        value={ing.unit || ''}
                        onChange={(e) => handleIngredientChange(gIdx, iIdx, 'unit', e.target.value)}
                        className="col-span-3 px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="שם המצרך"
                        value={ing.item}
                        onChange={(e) => handleIngredientChange(gIdx, iIdx, 'item', e.target.value)}
                        className="col-span-6 px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(gIdx, iIdx)}
                        className="col-span-1 p-1.5 text-stone-400 hover:text-red-600 flex justify-center"
                        title="מחק מצרך"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddIngredient(gIdx)}
                  className="flex items-center gap-1 text-xs font-medium text-[#78350F] hover:underline pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  הוסף מצרך
                </button>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="bg-white p-5 rounded-lg border border-[#E7E2DA] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-serif-hebrew text-stone-900">שלבי ההכנה</h3>
              <button
                type="button"
                onClick={handleAddStep}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#78350F] bg-amber-50/80 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                הוסף שלב הכנה
              </button>
            </div>

            {formData.steps.map((step, sIdx) => (
              <div key={sIdx} className="flex items-start gap-2 bg-[#FBF9F5] p-3 rounded-lg border border-stone-200">
                <span className="font-mono-tabular text-xs font-bold text-stone-500 mt-2 w-5">
                  {sIdx + 1}.
                </span>
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={2}
                    value={step.text}
                    onChange={(e) => handleStepChange(sIdx, 'text', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#78350F]"
                    placeholder="תיאור שלב ההכנה..."
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-stone-500">טיימר בדקות (אופציונלי):</label>
                    <input
                      type="number"
                      min="0"
                      value={step.timerMinutes || ''}
                      onChange={(e) => handleStepChange(sIdx, 'timerMinutes', e.target.value)}
                      placeholder="ללא"
                      className="w-20 px-2 py-1 text-xs font-mono-tabular bg-white border border-stone-300 rounded"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStep(sIdx)}
                  className="p-1.5 text-stone-400 hover:text-red-600 mt-1"
                  title="מחק שלב"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              {hasOriginalVersion && onResetToOriginal && (
                <button
                  type="button"
                  onClick={() => {
                    onResetToOriginal(formData.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-600 bg-stone-200/70 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  שחזר מתכון זה לנוסח ההתחלתי
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#78350F] rounded-lg hover:bg-[#5c280b] transition-colors"
              >
                <Save className="w-4 h-4" />
                שמור שינויים במתכון
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
