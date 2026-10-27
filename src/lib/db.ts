import Dexie, { type Table } from 'dexie';

/* ------------------------------------------------------------------ */
/*  Outbox item — queued for sync with Supabase                       */
/* ------------------------------------------------------------------ */
export interface OutboxItem {
  id?: number;
  /** Discriminator for the mutation type, e.g. "shift.clockIn" */
  type: string;
  /** Arbitrary JSON payload */
  payload: Record<string, unknown>;
  /** Client-generated UUID used for idempotency */
  clientUuid: string;
  createdAt: string;          // ISO 8601
  syncedAt: string | null;
  retryCount: number;
  lastError: string | null;
}

/* ------------------------------------------------------------------ */
/*  Cached entities — offline read access                             */
/* ------------------------------------------------------------------ */
export interface CachedShift {
  id: string;
  data: Record<string, unknown>;
}

export interface CachedPayslip {
  id: string;
  data: Record<string, unknown>;
}

export interface CachedReport {
  id: string;
  data: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Database class                                                    */
/* ------------------------------------------------------------------ */
class FairShiftDB extends Dexie {
  outbox!: Table<OutboxItem, number>;
  cachedShifts!: Table<CachedShift, string>;
  cachedPayslips!: Table<CachedPayslip, string>;
  cachedReports!: Table<CachedReport, string>;

  constructor() {
    super('fairshift');

    this.version(1).stores({
      outbox: '++id, type, clientUuid, createdAt, syncedAt, retryCount, lastError',
      cachedShifts: 'id',
      cachedPayslips: 'id',
      cachedReports: 'id',
    });
  }
}

export const db = new FairShiftDB();
