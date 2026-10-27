import {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type FeedbackType = 'success' | 'error' | 'queued';

interface Toast {
  id: number;
  type: FeedbackType;
  message: string;
}

interface FeedbackCtx {
  showSuccess: (msg?: string) => void;
  showError: (msg?: string) => void;
  showQueued: (msg?: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */
const FeedbackContext = createContext<FeedbackCtx | undefined>(undefined);

let nextId = 0;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback(
    (type: FeedbackType, msg?: string) => {
      const id = nextId++;
      const defaults: Record<FeedbackType, string> = {
        success: t('feedback.success'),
        error: t('feedback.error'),
        queued: t('offline.queued'),
      };
      const toast: Toast = { id, type, message: msg ?? defaults[type] };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((tt) => tt.id !== id));
      }, 4000);
    },
    [t],
  );

  const ctx = useMemo<FeedbackCtx>(
    () => ({
      showSuccess: (m) => push('success', m),
      showError: (m) => push('error', m),
      showQueued: (m) => push('queued', m),
    }),
    [push],
  );

  const bgColor: Record<FeedbackType, string> = {
    success: 'bg-success-500',
    error: 'bg-danger-500',
    queued: 'bg-warning-500',
  };

  return (
    <FeedbackContext.Provider value={ctx}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={[
              'rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg',
              'motion-safe:animate-[slideUp_0.3s_ease-out]',
              bgColor[toast.type],
            ].join(' ')}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackCtx {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be inside FeedbackProvider');
  return ctx;
}
