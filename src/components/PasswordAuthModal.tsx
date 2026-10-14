import React, { useState } from 'react';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';
import { verifyPassword } from '../utils/auth';

interface PasswordAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordAuthModal: React.FC<PasswordAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setError('אנא הזן תשובה');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await verifyPassword(passwordInput);
      if (isValid) {
        setPasswordInput('');
        setError(null);
        onSuccess();
      } else {
        setError('תשובה שגויה. אנא נסו שוב.');
      }
    } catch {
      setError('אירעה שגיאה באימות התשובה. אנא נסו שוב.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPasswordInput('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E7E2DA]">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#78350F]" />
            <h2 className="text-lg font-bold font-serif-hebrew text-stone-900">
              אימות סיסמת עריכה
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-stone-900 leading-snug">
              מי החברה הכי טובה של אמא? (שם פרטי ומשפחה)
            </label>
            <p className="text-xs text-stone-500">
              הממשק מוגן כדי למנוע שינויים לא מורשים במתכונים.
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              autoFocus
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="הזן שם פרטי ומשפחה..."
              className="w-full px-4 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#78350F] focus:ring-1 focus:ring-[#78350F]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#78350F] rounded-lg hover:bg-[#5c280b] transition-colors disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isVerifying ? 'מאמת...' : 'כניסה לעריכה'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
