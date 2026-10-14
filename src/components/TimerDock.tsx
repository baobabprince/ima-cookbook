import React, { useEffect } from 'react';
import { Bell, Pause, Play, Plus, RotateCcw, Timer, X } from 'lucide-react';
import { ActiveTimer } from '../types/recipe';

interface TimerDockProps {
  timers: ActiveTimer[];
  onToggleTimer: (id: string) => void;
  onResetTimer: (id: string) => void;
  onAddMinute: (id: string) => void;
  onRemoveTimer: (id: string) => void;
  onSelectRecipe: (recipeId: string) => void;
}

function playKitchenChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.18);
      osc.stop(ctx.currentTime + idx * 0.18 + 0.65);
    });
  } catch {
    // Ignore audio context restrictions if blocked
  }
}

export function formatSeconds(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const TimerDock: React.FC<TimerDockProps> = ({
  timers,
  onToggleTimer,
  onResetTimer,
  onAddMinute,
  onRemoveTimer,
  onSelectRecipe,
}) => {
  useEffect(() => {
    const justCompleted = timers.some((t) => t.isCompleted && t.remainingSeconds === 0);
    if (justCompleted) {
      playKitchenChime();
    }
  }, [timers]);

  if (timers.length === 0) return null;

  return (
    <div className="no-print fixed bottom-0 inset-x-0 z-40 bg-[#1C1917] text-[#FBF9F5] border-t border-stone-700 shadow-2xl px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-stone-300">
          <Timer className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium whitespace-nowrap">טיימרים פעילים במטבח ({timers.length})</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {timers.map((timer) => {
            const progress =
              timer.totalSeconds > 0
                ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100
                : 100;

            return (
              <div
                key={timer.id}
                className={`flex items-center gap-3 px-3.5 py-2 rounded-lg border transition-colors ${
                  timer.isCompleted
                    ? 'bg-amber-900/60 border-amber-400 text-amber-100'
                    : 'bg-stone-800/90 border-stone-700'
                }`}
              >
                <div className="min-w-0">
                  <button
                    onClick={() => onSelectRecipe(timer.recipeId)}
                    className="block text-xs font-medium text-stone-200 hover:text-amber-300 truncate max-w-[180px] text-right transition-colors"
                    title={timer.label}
                  >
                    {timer.label}
                  </button>
                  <div className="w-full bg-stone-700 h-1 rounded-full mt-1 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-transform duration-300 origin-right"
                      style={{ transform: `scaleX(${Math.min(1, progress / 100)})` }}
                    />
                  </div>
                </div>

                <div className="font-mono-tabular text-base font-semibold tracking-wider text-amber-300 px-1">
                  {timer.isCompleted ? (
                    <span className="flex items-center gap-1 text-amber-200 text-xs font-sans">
                      <Bell className="w-3.5 h-3.5 animate-bounce" />
                      הסתיים!
                    </span>
                  ) : (
                    formatSeconds(timer.remainingSeconds)
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleTimer(timer.id)}
                    className="p-1.5 rounded hover:bg-stone-700 text-stone-200 transition-colors"
                    title={timer.isRunning ? 'השהה' : 'המשך'}
                  >
                    {timer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onAddMinute(timer.id)}
                    className="px-1.5 py-1 rounded hover:bg-stone-700 text-xs font-mono-tabular text-stone-300 transition-colors"
                    title="הוסף דקה"
                  >
                    <Plus className="w-3 h-3 inline" />1ד׳
                  </button>
                  <button
                    onClick={() => onResetTimer(timer.id)}
                    className="p-1.5 rounded hover:bg-stone-700 text-stone-300 transition-colors"
                    title="אפס טיימר"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveTimer(timer.id)}
                    className="p-1.5 rounded hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
                    title="סגור טיימר"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
