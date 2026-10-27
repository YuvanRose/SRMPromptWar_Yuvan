import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { db } from '@/lib/db';
import { isDemoMode } from '@/lib/supabase';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
const MAX_RETRIES = 10;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function backoffDelay(retryCount: number): number {
  return Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
}

/* ------------------------------------------------------------------ */
/*  Add an item to the outbox                                         */
/* ------------------------------------------------------------------ */
export async function addToOutbox(
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const clientUuid = crypto.randomUUID();
  await db.outbox.add({
    type,
    payload,
    clientUuid,
    createdAt: new Date().toISOString(),
    syncedAt: null,
    retryCount: 0,
    lastError: null,
  });
  notifySubscribers();
  if (navigator.onLine && !isDemoMode) {
    void syncAll();
  }
}

/* ------------------------------------------------------------------ */
/*  Sync all pending items                                            */
/* ------------------------------------------------------------------ */
let syncing = false;

export async function syncAll(): Promise<void> {
  if (syncing || isDemoMode) return;
  syncing = true;

  try {
    const pending = await db.outbox
      .filter((item) => item.syncedAt === null && item.retryCount < MAX_RETRIES)
      .sortBy('id');

    for (const item of pending) {
      try {
        // In a real implementation this would call supabase.rpc(...)
        // For now we just mark as synced after a short delay
        await new Promise((r) => setTimeout(r, 300));

        await db.outbox.update(item.id!, {
          syncedAt: new Date().toISOString(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const nextRetry = (item.retryCount ?? 0) + 1;

        await db.outbox.update(item.id!, {
          retryCount: nextRetry,
          lastError: message,
        });

        if (nextRetry < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, backoffDelay(nextRetry)));
        }
      }
    }
  } finally {
    syncing = false;
    notifySubscribers();
  }
}

/* ------------------------------------------------------------------ */
/*  Pending count                                                     */
/* ------------------------------------------------------------------ */
export async function getPendingCount(): Promise<number> {
  return db.outbox.filter((item) => item.syncedAt === null).count();
}

/* ------------------------------------------------------------------ */
/*  External-store based reactivity for online/offline + pending      */
/* ------------------------------------------------------------------ */
type Subscriber = () => void;
const subscribers = new Set<Subscriber>();
let snapshotVersion = 0;

function notifySubscribers() {
  snapshotVersion += 1;
  subscribers.forEach((cb) => cb());
}

function subscribe(cb: Subscriber): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function getSnapshot(): number {
  return snapshotVersion;
}

// Listen for browser online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    notifySubscribers();
    if (!isDemoMode) void syncAll();
  });
  window.addEventListener('offline', () => {
    notifySubscribers();
  });
}

/* ------------------------------------------------------------------ */
/*  React hook                                                        */
/* ------------------------------------------------------------------ */
export interface OfflineStatus {
  isOnline: boolean;
  pendingCount: number;
}

export function useOfflineStatus(): OfflineStatus {
  const version = useSyncExternalStore(subscribe, getSnapshot);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(() => {
    void getPendingCount().then(setPendingCount);
  }, []);

  useEffect(() => {
    refresh();
  }, [version, refresh]);

  return useMemo(() => ({ isOnline, pendingCount }), [isOnline, pendingCount]);
}
