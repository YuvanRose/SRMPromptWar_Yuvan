import { useOfflineStatus, syncAll } from '@/lib/sync';
import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function OfflineBanner() {
  const { isOnline, pendingCount } = useOfflineStatus();
  const { t } = useTranslation();
  const [isSyncing, setIsSyncing] = useState(false);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncAll();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <aside
      aria-label="Network and synchronization status"
      className="bg-amber-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-between shadow-md transition-all duration-300"
    >
      <div className="flex items-center gap-2 max-w-full truncate">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />
            <span>
              {pendingCount > 0
                ? t('common.offlineChipPlural', {
                    count: pendingCount,
                    defaultValue: `Offline — ${pendingCount} items will sync when reconnected`,
                  })
                : t('common.offline', { defaultValue: 'You are currently offline' })}
            </span>
          </>
        ) : (
          <>
            <RefreshCw
              className={`w-4 h-4 shrink-0 text-white ${isSyncing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>
              {t('common.offlineChipPlural', {
                count: pendingCount,
                defaultValue: `${pendingCount} item(s) pending sync`,
              })}
            </span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="ml-3 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded min-h-[32px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          <span>{isSyncing ? t('common.syncing', 'Syncing...') : t('common.retry', 'Sync Now')}</span>
        </button>
      )}
    </aside>
  );
}
