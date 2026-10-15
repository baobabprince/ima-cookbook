import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileText,
  GitBranch,
  ListOrdered,
  Plus,
  Printer,
  RotateCcw,
  Scale,
  Search,
  Timer,
} from 'lucide-react';
import { INITIAL_RECIPES, RECIPE_CATEGORIES } from './data/allRecipes';
import {
  ActiveTimer,
  MargarineSubMode,
  Recipe,
  RecipeCategory,
  UnitDisplayMode,
} from './types/recipe';
import { formatIngredient, MOMS_NOTEBOOK_CONVERSIONS } from './utils/conversions';
import { exportRecipesToWord } from './utils/exportWord';
import { TimerDock } from './components/TimerDock';
import { ConversionCalculatorModal } from './components/ConversionCalculatorModal';
import { RecipeEditorModal } from './components/RecipeEditorModal';
import { PrintBookView } from './components/PrintBookView';
import { PasswordAuthModal } from './components/PasswordAuthModal';
import { isSessionAuthenticated, setSessionAuthenticated } from './utils/auth';
import { getCategoryEmoji } from './utils/category';
import {
  fetchRecipesFromGitHub,
  isGitHubSyncConfigured,
  saveAllRecipesToGitHub,
  saveRecipeToGitHub,
} from './utils/githubSync';

const STORAGE_KEY = 'moms_kitchen_recipes_v1';

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial recipes
    }
    return INITIAL_RECIPES;
  });

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    () => recipes[0]?.id || 'rec-001'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'הכל'>('הכל');
  const [viewMode, setViewMode] = useState<'single' | 'catalog' | 'printBook'>('single');

  // Interactive kitchen tools state
  const [scaleFactor, setScaleFactor] = useState<number>(1);
  const [unitMode, setUnitMode] = useState<UnitDisplayMode>('original');
  const [margarineMode, setMargarineMode] = useState<MargarineSubMode>('original');
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // Modals state
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const executeWithAuth = (action: () => void) => {
    if (isSessionAuthenticated()) {
      action();
    } else {
      setPendingAction(() => action);
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setSessionAuthenticated(true);
    setIsAuthModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Active kitchen timers
  const [timers, setTimers] = useState<ActiveTimer[]>([]);

  // Sync recipes from GitHub on initial app startup
  useEffect(() => {
    let isMounted = true;
    async function loadLatestFromGitHub() {
      try {
        setIsSyncing(true);
        const { recipes: remoteRecipes } = await fetchRecipesFromGitHub();
        if (isMounted && Array.isArray(remoteRecipes) && remoteRecipes.length > 0) {
          setRecipes(remoteRecipes);
        }
      } catch {
        // Keep current state/localStorage if offline or not configured
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }
    loadLatestFromGitHub();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save recipes to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    } catch {
      // Ignore storage quota errors
    }
  }, [recipes]);

  // Countdown interval for active timers
  useEffect(() => {
    const hasRunning = timers.some((t) => t.isRunning && !t.isCompleted);
    if (!hasRunning) return;

    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.isRunning || t.isCompleted) return t;
          if (t.remainingSeconds <= 1) {
            return {
              ...t,
              remainingSeconds: 0,
              isRunning: false,
              isCompleted: true,
            };
          }
          return {
            ...t,
            remainingSeconds: t.remainingSeconds - 1,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timers]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Filtered recipes preserving exact sequential orderIndex
  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...recipes]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .filter((r) => {
        if (selectedCategory !== 'הכל' && r.category !== selectedCategory) {
          return false;
        }
        if (!q) return true;
        const inTitle = r.title.toLowerCase().includes(q);
        const inSource = r.source?.toLowerCase().includes(q) || false;
        const inIndex = String(r.orderIndex) === q;
        const inIngredients = r.ingredientGroups.some((g) =>
          g.items.some((i) => i.item.toLowerCase().includes(q))
        );
        return inTitle || inSource || inIndex || inIngredients;
      });
  }, [recipes, searchQuery, selectedCategory]);

  const activeRecipe = useMemo(() => {
    return (
      recipes.find((r) => r.id === selectedRecipeId) ||
      filteredRecipes[0] ||
      recipes[0]
    );
  }, [recipes, selectedRecipeId, filteredRecipes]);

  const activeRecipeIndexInAll = useMemo(() => {
    const sorted = [...recipes].sort((a, b) => a.orderIndex - b.orderIndex);
    return sorted.findIndex((r) => r.id === activeRecipe?.id);
  }, [recipes, activeRecipe]);

  const prevRecipe = useMemo(() => {
    const sorted = [...recipes].sort((a, b) => a.orderIndex - b.orderIndex);
    return activeRecipeIndexInAll > 0 ? sorted[activeRecipeIndexInAll - 1] : null;
  }, [recipes, activeRecipeIndexInAll]);

  const nextRecipe = useMemo(() => {
    const sorted = [...recipes].sort((a, b) => a.orderIndex - b.orderIndex);
    return activeRecipeIndexInAll >= 0 && activeRecipeIndexInAll < sorted.length - 1
      ? sorted[activeRecipeIndexInAll + 1]
      : null;
  }, [recipes, activeRecipeIndexInAll]);

  const handleStartTimer = (recipe: Recipe, minutes: number, label?: string) => {
    const timerLabel = label || `${recipe.title} (${minutes} דק׳)`;
    const newTimer: ActiveTimer = {
      id: `timer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      label: timerLabel,
      totalSeconds: minutes * 60,
      remainingSeconds: minutes * 60,
      isRunning: true,
      isCompleted: false,
    };
    setTimers((prev) => [...prev, newTimer]);
    showToast(`טיימר הופעל: ${timerLabel}`);
  };

  const handleToggleTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id && !t.isCompleted ? { ...t, isRunning: !t.isRunning } : t
      )
    );
  };

  const handleResetTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              remainingSeconds: t.totalSeconds,
              isRunning: true,
              isCompleted: false,
            }
          : t
      )
    );
  };

  const handleAddMinute = (id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              totalSeconds: t.totalSeconds + 60,
              remainingSeconds: t.remainingSeconds + 60,
              isCompleted: false,
              isRunning: true,
            }
          : t
      )
    );
  };

  const handleRemoveTimer = (id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveRecipe = async (updated: Recipe) => {
    // 1. Instantly update local state & localStorage
    setRecipes((prev) => {
      const exists = prev.some((r) => r.id === updated.id);
      if (exists) {
        return prev.map((r) => (r.id === updated.id ? updated : r));
      }
      return [...prev, updated];
    });
    setSelectedRecipeId(updated.id);

    // 2. Sync changes to Git if configured
    if (isGitHubSyncConfigured()) {
      showToast(`שומר ומסנכרן את "${updated.title}" ל-Git...`);
      setIsSyncing(true);
      const res = await saveRecipeToGitHub(updated);
      setIsSyncing(false);

      if (res.success) {
        setRecipes(res.recipes);
        showToast(`המתכון "${updated.title}" נשמר וסונכרן בהצלחה ל-Git`);
      } else {
        showToast(`המתכון נשמר בדפדפן המקומי (${res.error || 'שגיאת סנכרון ל-Git'})`);
      }
    } else {
      showToast(`המתכון "${updated.title}" נשמר בהצלחה בדפדפן המקומי`);
    }
  };

  const handleAddNewRecipe = () => {
    const maxOrder = recipes.reduce((max, r) => Math.max(max, r.orderIndex), 0);
    const newRecipe: Recipe = {
      id: `rec-custom-${Date.now()}`,
      orderIndex: maxOrder + 1,
      title: 'מתכון חדש של אמא',
      category: 'עוגות פירות, הדרים ובחושות',
      yieldText: 'תבנית בינונית',
      ovenTemp: '180 מעלות',
      ingredientGroups: [
        {
          items: [
            { amount: 2, unit: 'כוסות', item: 'קמח' },
            { amount: 1, unit: 'כוס', item: 'סוכר' },
          ],
        },
      ],
      steps: [{ text: 'מערבבים את החומרים ואופים עד להזהבה.', timerMinutes: 30 }],
    };
    setEditingRecipe(newRecipe);
  };

  const handleResetSingleRecipe = (recipeId: string) => {
    const original = INITIAL_RECIPES.find((r) => r.id === recipeId);
    if (!original) return;
    handleSaveRecipe(original);
  };

  const handleResetAllRecipes = async () => {
    setRecipes(INITIAL_RECIPES);
    localStorage.removeItem(STORAGE_KEY);
    setIsResetModalOpen(false);

    if (isGitHubSyncConfigured()) {
      showToast('מאפס ומעדכן את Git...');
      setIsSyncing(true);
      const res = await saveAllRecipesToGitHub(
        INITIAL_RECIPES,
        'איפוס כל המתכונים לנוסח ההתחלתי'
      );
      setIsSyncing(false);

      if (res.success) {
        setRecipes(res.recipes);
        showToast('כל המתכונים שוחזרו וסונכרנו בהצלחה ל-Git');
      } else {
        showToast('כל המתכונים שוחזרו בדפדפן המקומי');
      }
    } else {
      showToast('כל המתכונים שוחזרו לנוסח הערוך המקורי');
    }
  };

  const handleExportWordClick = async () => {
    try {
      setIsExportingWord(true);
      await exportRecipesToWord(recipes);
      showToast('קובץ ה-Word (.docx) הורד בהצלחה');
    } catch {
      showToast('אירעה שגיאה בייצוא קובץ ה-Word');
    } finally {
      setIsExportingWord(false);
    }
  };

  const toggleIngredientCheck = (key: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleStepCompleted = (key: string) => {
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // If in Decorated Print / PDF Book Mode
  if (viewMode === 'printBook') {
    return (
      <>
        <PrintBookView
          recipes={recipes}
          onExitPrintView={() => setViewMode('single')}
          onExportWord={handleExportWordClick}
          onEditRecipe={(rec) => executeWithAuth(() => setEditingRecipe(rec))}
        />
        <RecipeEditorModal
          recipe={editingRecipe}
          isOpen={Boolean(editingRecipe)}
          onClose={() => setEditingRecipe(null)}
          onSave={handleSaveRecipe}
          onResetToOriginal={handleResetSingleRecipe}
          hasOriginalVersion={Boolean(
            editingRecipe && INITIAL_RECIPES.some((r) => r.id === editingRecipe.id)
          )}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#512f00] pb-20">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-white/95 backdrop-blur border-b border-[#E7E2DA]">
        {/* Zone 1: Brand Title (single text element) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setSelectedCategory('הכל');
            setSearchQuery('');
            setViewMode('single');
          }}
          className="text-2xl font-bold font-serif-hebrew tracking-tight text-stone-900 whitespace-nowrap shrink-0"
        >
          המטבח של אמא
        </a>

        {/* Zone 2: 4–5 Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
          <button
            onClick={() => setViewMode(viewMode === 'catalog' ? 'single' : 'catalog')}
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {viewMode === 'catalog' ? 'תצוגת מתכון בודד' : 'תוכן עניינים מלא'}
          </button>
          <button
            onClick={() => setIsCalcOpen(true)}
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            המרת מידות ומחשבון
          </button>
          <button
            onClick={() => executeWithAuth(handleAddNewRecipe)}
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            הוספת מתכון
          </button>
          <button
            onClick={handleExportWordClick}
            disabled={isExportingWord}
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {isExportingWord ? 'מייצא קובץ Word...' : 'הורדת קובץ Word'}
          </button>
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            ניהול וגיבוי
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setViewMode('printBook')}
            className="px-4 py-2 text-xs font-medium text-white bg-[#78350F] rounded-lg hover:bg-[#5c280b] transition-colors whitespace-nowrap shrink-0"
          >
            מהדורת ספר להדפסה / PDF
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed top-20 left-6 z-50 bg-stone-900 text-stone-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border border-stone-700">
          <Check className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Editorial Subheader / Operational Utility Strip */}
      <section className="no-print bg-white border-b border-[#E7E2DA] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Segmented Controls */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setSelectedCategory('הכל')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === 'הכל'
                  ? 'bg-stone-900 text-white'
                  : 'bg-[#FBF9F5] text-stone-600 hover:text-stone-900 border border-[#E7E2DA]'
              }`}
            >
              כל הספר ({recipes.length})
            </button>
            {RECIPE_CATEGORIES.map((cat) => {
              const count = recipes.filter((r) => r.category === cat).length;
              const emoji = getCategoryEmoji(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white'
                      : 'bg-[#FBF9F5] text-stone-600 hover:text-stone-900 border border-[#E7E2DA]'
                  }`}
                >
                  {emoji} {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Mobile Quick Actions */}
          <div className="flex md:hidden items-center gap-2 overflow-x-auto pt-1">
            <button
              onClick={() => setViewMode(viewMode === 'catalog' ? 'single' : 'catalog')}
              className="px-3 py-1.5 text-xs font-medium bg-[#FBF9F5] border border-[#E7E2DA] rounded-md whitespace-nowrap shrink-0"
            >
              {viewMode === 'catalog' ? 'מתכון בודד' : 'כל המתכונים'}
            </button>
            <button
              onClick={() => setIsCalcOpen(true)}
              className="px-3 py-1.5 text-xs font-medium bg-[#FBF9F5] border border-[#E7E2DA] rounded-md whitespace-nowrap shrink-0"
            >
              המרת מידות
            </button>
            <button
              onClick={handleExportWordClick}
              className="px-3 py-1.5 text-xs font-medium bg-[#FBF9F5] border border-[#E7E2DA] rounded-md whitespace-nowrap shrink-0"
            >
              קובץ Word
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Container (1400px Desktop Layout) */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Right Column (RTL): Recipe Index Sidebar (4 cols) */}
        <aside className="no-print lg:col-span-4 xl:col-span-3 bg-white border border-[#E7E2DA] rounded-xl overflow-hidden lg:sticky lg:top-24">
          <div className="p-4 border-b border-[#E7E2DA] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif-hebrew text-stone-900">
                אינדקס המתכונים (לפי הסדר)
              </h2>
              <span className="text-xs font-mono-tabular text-stone-500">
                {filteredRecipes.length} מתוך {recipes.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש מתכון, מצרך, מספר או מקור..."
                className="w-full pr-9 pl-3 py-2 text-xs bg-[#FBF9F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#78350F]"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#FBF9F5] rounded-lg border border-[#E7E2DA]">
              <button
                onClick={() => setViewMode('single')}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  viewMode === 'single'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                מתכון בודד
              </button>
              <button
                onClick={() => setViewMode('catalog')}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  viewMode === 'catalog'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                רצף כל הספר
              </button>
            </div>
          </div>

          {/* Scrollable Sequential Recipe List */}
          <div className="max-h-[62vh] overflow-y-auto divide-y divide-stone-100">
            {filteredRecipes.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                לא נמצאו מתכונים התואמים לחיפוש "{searchQuery}".
              </div>
            ) : (
              filteredRecipes.map((rec) => {
                const isSelected = activeRecipe?.id === rec.id && viewMode === 'single';
                return (
                  <button
                    key={rec.id}
                    onClick={() => {
                      setSelectedRecipeId(rec.id);
                      setViewMode('single');
                    }}
                    className={`w-full text-right px-4 py-3 flex items-baseline justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-[#78350F]/10 text-[#78350F] font-semibold'
                        : 'hover:bg-[#FBF9F5] text-stone-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm truncate">
                        <span className="font-mono-tabular text-xs font-normal text-stone-500 ml-1.5">
                          {rec.orderIndex}.
                        </span>
                        {rec.title}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate mt-0.5">
                        {rec.category}
                        {rec.source ? ` · ${rec.source}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Left Column (RTL): Main Recipe Reading & Interactive Kitchen Canvas (8–9 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Interactive Kitchen Toolbar (Scaling, Units, Substitutions) */}
          <div className="no-print bg-white border border-[#E7E2DA] rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            {/* Quantity Multiplier */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-stone-700 ml-1">מחשבון כמויות:</span>
              <div className="flex items-center gap-1 p-1 bg-[#FBF9F5] border border-[#E7E2DA] rounded-lg">
                {[0.5, 1, 1.5, 2, 3].map((factor) => (
                  <button
                    key={factor}
                    onClick={() => setScaleFactor(factor)}
                    className={`px-2.5 py-1 text-xs font-mono-tabular font-medium rounded transition-colors whitespace-nowrap ${
                      scaleFactor === factor
                        ? 'bg-[#78350F] text-white'
                        : 'text-stone-700 hover:bg-stone-200/60'
                    }`}
                  >
                    x{factor}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume vs Metric Weight Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-stone-700">תצוגת מידות:</span>
              <div className="flex items-center gap-1 p-1 bg-[#FBF9F5] border border-[#E7E2DA] rounded-lg">
                <button
                  onClick={() => setUnitMode('original')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    unitMode === 'original'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  כוסות וכפות (במקור)
                </button>
                <button
                  onClick={() => setUnitMode('metric')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    unitMode === 'metric'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  משקלים (גרם / מ"ל)
                </button>
              </div>
            </div>

            {/* Mom's Margarine Conversion Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-stone-700">המרת מרגרינה:</span>
              <div className="flex items-center gap-1 p-1 bg-[#FBF9F5] border border-[#E7E2DA] rounded-lg">
                <button
                  onClick={() => setMargarineMode('original')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    margarineMode === 'original'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  לפי המתכון
                </button>
                <button
                  onClick={() => setMargarineMode('butter')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    margarineMode === 'butter'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  המר לחמאה
                </button>
                <button
                  onClick={() => setMargarineMode('oil')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    margarineMode === 'oil'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="לפי טבלת ההמרות של אמא: 1 מרגרינה = ¾ כוס שמן"
                >
                  המר לשמן (¾ כוס)
                </button>
              </div>
            </div>
          </div>

          {/* Mode A: Single Active Recipe View */}
          {viewMode === 'single' && activeRecipe && (
            <div className="space-y-6">
              {/* Recipe Card */}
              <article className="single-recipe-print-card bg-white border border-[#E7E2DA] rounded-xl p-6 sm:p-10 print:p-4 shadow-xs">
                {/* Recipe Metadata & Actions Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E7E2DA] pb-6 print:pb-2 mb-8 print:mb-3">
                  <div className="space-y-2 print:space-y-0.5 max-w-2xl">
                    {/* Zero-pill unboxed metadata with typographic separators */}
                    <div className="flex flex-wrap items-center gap-2 print:gap-1 text-xs print:text-[10px] text-stone-500">
                      <span className="font-mono-tabular font-normal text-stone-500">
                        מתכון #{activeRecipe.orderIndex} מתוך {recipes.length}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{activeRecipe.category}</span>
                      {activeRecipe.source && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-stone-700">{activeRecipe.source}</span>
                        </>
                      )}
                      {activeRecipe.yieldText && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{activeRecipe.yieldText}</span>
                        </>
                      )}
                      {activeRecipe.ovenTemp && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#78350F]">
                            חום תנור: {activeRecipe.ovenTemp}
                          </span>
                        </>
                      )}
                    </div>

                    <h1 className="text-3xl sm:text-4xl print:text-xl font-bold font-serif-hebrew text-stone-900 leading-tight">
                      <span className="font-normal font-sans text-stone-500 ml-2">{activeRecipe.orderIndex}.</span>
                      {activeRecipe.title}
                    </h1>

                    {activeRecipe.prepNote && (
                      <p className="text-sm print:text-xs text-stone-600 leading-relaxed pt-1 print:pt-0">
                        {activeRecipe.prepNote}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="no-print flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => executeWithAuth(() => setEditingRecipe(activeRecipe))}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-800 bg-[#FBF9F5] border border-[#E7E2DA] rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#78350F]" />
                      עריכת מתכון
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-800 bg-[#FBF9F5] border border-[#E7E2DA] rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap"
                      title="הדפס מתכון זה"
                    >
                      <Printer className="w-3.5 h-3.5 text-stone-600" />
                      הדפס מתכון
                    </button>
                  </div>
                </div>

                {/* Two-Column Recipe Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-8 print:gap-4">
                  {/* Ingredients Column (5 cols) */}
                  <div className="lg:col-span-5 print:col-span-5 bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl p-5 sm:p-6 print:p-3">
                    <div className="flex items-center justify-between border-b border-[#E7E2DA] pb-3 print:pb-1.5 mb-4 print:mb-2">
                      <h2 className="text-xl print:text-sm font-bold font-serif-hebrew text-stone-900">
                        מצרכים
                      </h2>
                      {scaleFactor !== 1 && (
                        <span className="text-xs font-mono-tabular font-bold text-[#78350F]">
                          מותאם פי {scaleFactor}
                        </span>
                      )}
                    </div>

                    <div className="space-y-6 print:space-y-2">
                      {activeRecipe.ingredientGroups.map((group, gIdx) => (
                        <div key={gIdx}>
                          {group.groupTitle && (
                            <h3 className="text-xs print:text-[10px] font-bold text-[#78350F] mb-2.5 print:mb-1 tracking-wide">
                              {group.groupTitle}
                            </h3>
                          )}
                          <ul className="space-y-2.5 print:space-y-1">
                            {group.items.map((ing, iIdx) => {
                              const checkKey = `${activeRecipe.id}-ing-${gIdx}-${iIdx}`;
                              const isChecked = Boolean(checkedIngredients[checkKey]);
                              const f = formatIngredient(
                                ing,
                                scaleFactor,
                                unitMode,
                                margarineMode
                              );

                              return (
                                <li key={iIdx}>
                                  <label className="flex items-start gap-2.5 print:gap-1.5 cursor-pointer group select-none text-sm print:text-xs leading-snug">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleIngredientCheck(checkKey)}
                                      className="no-print mt-1 w-4 h-4 rounded border-stone-300 text-[#78350F] focus:ring-[#78350F]"
                                    />
                                    <span
                                      className={`flex-1 transition-colors ${
                                        isChecked
                                          ? 'line-through text-stone-400'
                                          : 'text-stone-800 group-hover:text-stone-950'
                                      }`}
                                    >
                                      {f.displayAmount && (
                                        <strong className="font-mono-tabular font-bold text-stone-900 ml-1">
                                          {f.displayAmount}
                                        </strong>
                                      )}
                                      {f.displayUnit && (
                                        <strong className="font-semibold text-stone-900 ml-1">
                                          {f.displayUnit}
                                        </strong>
                                      )}
                                      <span>{f.displayItem}</span>
                                      {f.displayNote && (
                                        <span className="text-xs print:text-[10px] text-stone-500 mr-1">
                                          ({f.displayNote})
                                        </span>
                                      )}
                                      {unitMode === 'original' && f.metricHint && (
                                        <span className="text-xs font-mono-tabular text-stone-400 mr-1.5">
                                          [{f.metricHint}]
                                        </span>
                                      )}
                                    </span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions & Timers Column (7 cols) */}
                  <div className="lg:col-span-7 print:col-span-7 flex flex-col justify-between space-y-6 print:space-y-2">
                    <div>
                      <div className="flex items-center justify-between border-b border-[#E7E2DA] pb-3 print:pb-1.5 mb-5 print:mb-2">
                        <h2 className="text-xl print:text-sm font-bold font-serif-hebrew text-stone-900">
                          אופן ההכנה
                        </h2>
                        <span className="no-print text-xs text-stone-500">
                          לחצו על שלב לסימון או הפעילו טיימר
                        </span>
                      </div>

                      <ol className="space-y-4 print:space-y-2">
                        {activeRecipe.steps.map((step, sIdx) => {
                          const stepKey = `${activeRecipe.id}-step-${sIdx}`;
                          const isDone = Boolean(completedSteps[stepKey]);

                          return (
                            <li
                              key={sIdx}
                              className={`p-4 print:p-2 rounded-xl print:rounded-lg border transition-colors ${
                                isDone
                                  ? 'bg-[#FBF9F5]/60 border-stone-200 text-stone-400'
                                  : 'bg-white border-[#E7E2DA] hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-start gap-3.5 print:gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleStepCompleted(stepKey)}
                                  className={`w-6 h-6 print:w-4 print:h-4 rounded-full flex items-center justify-center text-xs print:text-[10px] font-mono-tabular font-bold shrink-0 mt-0.5 transition-colors ${
                                    isDone
                                      ? 'bg-[#3F6212] text-white'
                                      : 'bg-[#FBF9F5] border border-stone-300 text-[#78350F] hover:border-[#78350F]'
                                  }`}
                                >
                                  {isDone ? <Check className="w-3.5 h-3.5 print:w-2.5 print:h-2.5" /> : sIdx + 1}
                                </button>

                                <div className="flex-1 space-y-2.5 print:space-y-0.5">
                                  <p
                                    onClick={() => toggleStepCompleted(stepKey)}
                                    className={`text-base print:text-xs leading-relaxed print:leading-snug cursor-pointer ${
                                      isDone ? 'line-through text-stone-400' : 'text-stone-800'
                                    }`}
                                  >
                                    {step.text}
                                  </p>

                                  {step.timerMinutes && (
                                    <div className="no-print pt-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStartTimer(
                                            activeRecipe,
                                            step.timerMinutes!,
                                            step.timerLabel
                                          )
                                        }
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#78350F] bg-amber-50/90 hover:bg-amber-100 border border-amber-200/90 rounded-lg transition-colors"
                                      >
                                        <Timer className="w-3.5 h-3.5" />
                                        <span>
                                          הפעל טיימר: {step.timerMinutes} דקות
                                          {step.timerLabel ? ` (${step.timerLabel})` : ''}
                                        </span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </div>

                    {/* Tips Section */}
                    {activeRecipe.tips && activeRecipe.tips.length > 0 && (
                      <div className="bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl p-4 print:p-2 space-y-1.5 print:space-y-0.5">
                        <div className="text-xs print:text-[10px] font-bold text-[#78350F]">
                          טיפים והערות מהמחברת של אמא:
                        </div>
                        {activeRecipe.tips.map((tip, tIdx) => (
                          <p key={tIdx} className="text-xs sm:text-sm print:text-xs text-stone-700 leading-relaxed print:leading-snug">
                            • {tip}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sequential Prev / Next Navigation Footer */}
                <div className="no-print mt-10 pt-6 border-t border-[#E7E2DA] flex items-center justify-between gap-4">
                  {prevRecipe ? (
                    <button
                      onClick={() => setSelectedRecipeId(prevRecipe.id)}
                      className="flex items-center gap-2 text-right group px-3 py-2 rounded-lg hover:bg-[#FBF9F5] transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#78350F]" />
                      <div>
                        <div className="text-[11px] text-stone-400">המתכון הקודם בספר</div>
                        <div className="text-xs sm:text-sm font-semibold text-stone-800 group-hover:text-[#78350F]">
                          <span className="font-normal text-stone-500 ml-1">#{prevRecipe.orderIndex}</span>
                          {prevRecipe.title}
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextRecipe ? (
                    <button
                      onClick={() => setSelectedRecipeId(nextRecipe.id)}
                      className="flex items-center gap-2 text-left group px-3 py-2 rounded-lg hover:bg-[#FBF9F5] transition-colors"
                    >
                      <div>
                        <div className="text-[11px] text-stone-400">המתכון הבא בספר</div>
                        <div className="text-xs sm:text-sm font-semibold text-stone-800 group-hover:text-[#78350F]">
                          <span className="font-normal text-stone-500 ml-1">#{nextRecipe.orderIndex}</span>
                          {nextRecipe.title}
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:text-[#78350F]" />
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              </article>

              {/* Mom's Conversion Table Reference Strip below the recipe */}
              <div className="no-print bg-white border border-[#E7E2DA] rounded-xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#78350F]" />
                    <h3 className="text-sm font-bold font-serif-hebrew text-stone-900">
                      המרת יחידות מהמחברת של אמא (תמיד מול העיניים)
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCalcOpen(true)}
                    className="text-xs font-medium text-[#78350F] hover:underline flex items-center gap-1"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    פתח מחשבון משקלים ותבניות מלא
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
                  {MOMS_NOTEBOOK_CONVERSIONS.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#FBF9F5] border border-[#E7E2DA] rounded-lg"
                    >
                      <div className="font-semibold text-stone-800">{c.title}</div>
                      <div className="text-[#78350F] font-bold mt-0.5">= {c.equivalent}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mode B: Continuous Book / Catalog Scroll View */}
          {viewMode === 'catalog' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E7E2DA] rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-serif-hebrew text-stone-900">
                    כל מתכוני הספר ברצף ({filteredRecipes.length} מתכונים)
                  </h1>
                  <p className="text-xs text-stone-500 mt-1">
                    המתכונים מוצגים בסדר המדויק שבו הם מופיעים במחברת המקורית של אמא.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportWordClick}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#FBF9F5] border border-[#E7E2DA] rounded-lg hover:bg-stone-100"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#78350F]" />
                    הורד כקובץ Word
                  </button>
                  <button
                    onClick={() => setViewMode('printBook')}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#78350F] text-white rounded-lg hover:bg-[#5c280b]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    תצוגת הדפסה / PDF
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {filteredRecipes.map((rec) => (
                  <article
                    key={rec.id}
                    className="bg-white border border-[#E7E2DA] rounded-xl p-6 shadow-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E7E2DA] pb-4 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-1">
                          <span className="font-mono-tabular font-normal text-stone-500">
                            מתכון #{rec.orderIndex}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{rec.category}</span>
                          {rec.source && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-stone-700">{rec.source}</span>
                            </>
                          )}
                          {rec.yieldText && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{rec.yieldText}</span>
                            </>
                          )}
                          {rec.ovenTemp && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{rec.ovenTemp}</span>
                            </>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold font-serif-hebrew text-stone-900">
                          <span className="font-normal font-sans text-stone-500 ml-2">{rec.orderIndex}.</span>
                          {rec.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRecipeId(rec.id);
                            setViewMode('single');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-[#78350F] bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100"
                        >
                          פתח במצב הכנה
                        </button>
                        <button
                          onClick={() => executeWithAuth(() => setEditingRecipe(rec))}
                          className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-[#FBF9F5] border border-[#E7E2DA] rounded-lg hover:bg-stone-100"
                        >
                          עריכה
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-5 bg-[#FBF9F5] p-4 rounded-lg border border-[#E7E2DA]">
                        <h3 className="text-xs font-bold text-stone-900 mb-2">מצרכים:</h3>
                        <div className="space-y-2.5">
                          {rec.ingredientGroups.map((g, gIdx) => (
                            <div key={gIdx}>
                              {g.groupTitle && (
                                <div className="text-xs font-bold text-[#78350F] mb-1">
                                  {g.groupTitle}:
                                </div>
                              )}
                              <ul className="space-y-1 text-xs text-stone-800">
                                {g.items.map((ing, iIdx) => {
                                  const f = formatIngredient(
                                    ing,
                                    scaleFactor,
                                    unitMode,
                                    margarineMode
                                  );
                                  return (
                                    <li key={iIdx}>
                                      •{' '}
                                      {f.displayAmount && (
                                        <strong className="font-mono-tabular ml-1">
                                          {f.displayAmount}
                                        </strong>
                                      )}
                                      {f.displayUnit && (
                                        <strong className="ml-1">{f.displayUnit}</strong>
                                      )}
                                      <span>{f.displayItem}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-7">
                        <h3 className="text-xs font-bold text-stone-900 mb-2">אופן ההכנה:</h3>
                        <ol className="space-y-2 text-xs sm:text-sm text-stone-800 leading-relaxed">
                          {rec.steps.map((st, sIdx) => (
                            <li key={sIdx} className="flex items-baseline gap-2">
                              <span className="font-mono-tabular font-bold text-[#78350F] shrink-0">
                                {sIdx + 1}.
                              </span>
                              <div>
                                <span>{st.text}</span>
                                {st.timerMinutes && (
                                  <button
                                    onClick={() =>
                                      handleStartTimer(rec, st.timerMinutes!, st.timerLabel)
                                    }
                                    className="mr-2 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-[#78350F] bg-amber-50 border border-amber-200 rounded hover:bg-amber-100"
                                  >
                                    <Timer className="w-3 h-3" />
                                    {st.timerMinutes} דק׳
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ConversionCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onApplyScaleFactor={(factor) => {
          setScaleFactor(factor);
          showToast(`מכפיל הכמויות עודכן ל-x${factor}`);
        }}
      />

      <RecipeEditorModal
        recipe={editingRecipe}
        isOpen={Boolean(editingRecipe)}
        onClose={() => setEditingRecipe(null)}
        onSave={handleSaveRecipe}
        onResetToOriginal={handleResetSingleRecipe}
        hasOriginalVersion={Boolean(
          editingRecipe && INITIAL_RECIPES.some((r) => r.id === editingRecipe.id)
        )}
      />

      {/* Backup & Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold font-serif-hebrew text-stone-900">
              ניהול נתוני הספר, סנכרון וגיבוי
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              שינויים שתבצעו יישמרו ויסונכרנו ל-Git (GitHub) במידה ומוגדר VITE_GITHUB_TOKEN, או יישמרו בדפדפן המקומי.
            </p>

            <div className="p-3 bg-[#FBF9F5] border border-[#E7E2DA] rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-stone-800">
                <GitBranch className="w-4 h-4 text-[#78350F]" />
                <span>סטטוס סנכרון Git:</span>
                <span
                  className={
                    isGitHubSyncConfigured() ? 'text-emerald-700 font-bold' : 'text-amber-800 font-bold'
                  }
                >
                  {isGitHubSyncConfigured() ? 'פעיל (סנכרון מול GitHub)' : 'מקומי (בדפדפן בלבד)'}
                </span>
              </div>
              {!isGitHubSyncConfigured() && (
                <p className="text-[11px] text-stone-500 leading-snug">
                  להפעלת סנכרון אוטומטי מול GitHub לכל המשתמשים, יש להגדיר את המשתנה VITE_GITHUB_TOKEN בקובץ .env.
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setIsResetModalOpen(false);
                  handleExportWordClick();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-[#78350F] rounded-lg hover:bg-[#5c280b] transition-colors"
              >
                <FileText className="w-4 h-4" />
                הורד קובץ Word (.docx) של כל הספר
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(recipes, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'moms_recipes_backup.json';
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('קובץ הגיבוי הורד בהצלחה');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-stone-800 bg-white border border-[#E7E2DA] rounded-lg hover:bg-stone-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                הורד קובץ גיבוי נתונים (JSON)
              </button>

              <button
                onClick={() => executeWithAuth(handleResetAllRecipes)}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                אפס את כל המתכונים לנוסח ההתחלתי
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E7E2DA]">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Authentication Modal */}
      <PasswordAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handleAuthSuccess}
      />

      {/* Floating Multi-Timer Kitchen Dock */}
      <TimerDock
        timers={timers}
        onToggleTimer={handleToggleTimer}
        onResetTimer={handleResetTimer}
        onAddMinute={handleAddMinute}
        onRemoveTimer={handleRemoveTimer}
        onSelectRecipe={(recId) => {
          setSelectedRecipeId(recId);
          setViewMode('single');
        }}
      />
    </div>
  );
}
