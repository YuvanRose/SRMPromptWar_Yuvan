import { useAuth } from '@/lib/auth';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
export interface ShiftPattern {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
}

export interface SectorConfig {
  id: string;
  label: string;
  /** Label for a single site/department */
  siteLabel: string;
  sitePluralLabel: string;
  supervisorLabel: string;
  workerLabel: string;
  workerPluralLabel: string;
  shiftPatterns: ShiftPattern[];
  hazardTypes: string[];
  /** Daily hours threshold after which overtime starts */
  overtimeDaily: number;
  /** Weekly hours threshold after which overtime starts */
  overtimeWeekly: number;
  /** Multiplier applied to OT hours */
  overtimeMultiplier: number;
}

/* ------------------------------------------------------------------ */
/*  Sector configurations                                             */
/* ------------------------------------------------------------------ */
export const SECTORS: Record<string, SectorConfig> = {
  construction: {
    id: 'construction',
    label: 'Construction',
    siteLabel: 'Site',
    sitePluralLabel: 'Sites',
    supervisorLabel: 'Supervisor',
    workerLabel: 'Worker',
    workerPluralLabel: 'Workers',
    shiftPatterns: [
      { id: 'morning', label: 'Morning', startHour: 6, endHour: 14 },
      { id: 'day', label: 'Day', startHour: 8, endHour: 17 },
      { id: 'evening', label: 'Evening', startHour: 14, endHour: 22 },
      { id: 'night', label: 'Night', startHour: 22, endHour: 6 },
    ],
    hazardTypes: [
      'Fall from height',
      'Electrical hazard',
      'Structural instability',
      'Equipment malfunction',
      'Chemical exposure',
      'Heat stress',
      'Noise exposure',
      'Trench collapse',
    ],
    overtimeDaily: 8,
    overtimeWeekly: 48,
    overtimeMultiplier: 2.0,
  },
  college: {
    id: 'college',
    label: 'College',
    siteLabel: 'Department',
    sitePluralLabel: 'Departments',
    supervisorLabel: 'HOD',
    workerLabel: 'Staff',
    workerPluralLabel: 'Staff',
    shiftPatterns: [
      { id: 'morning', label: 'Morning', startHour: 8, endHour: 14 },
      { id: 'full-day', label: 'Full Day', startHour: 9, endHour: 17 },
      { id: 'afternoon', label: 'Afternoon', startHour: 12, endHour: 18 },
    ],
    hazardTypes: [
      'Lab chemical spill',
      'Electrical fault',
      'Fire safety violation',
      'Ergonomic issue',
      'Slip/trip hazard',
      'Ventilation problem',
    ],
    overtimeDaily: 8,
    overtimeWeekly: 45,
    overtimeMultiplier: 1.5,
  },
};

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */
export function useSector(): SectorConfig {
  const { profile } = useAuth();
  const sectorId = profile?.sector ?? 'construction';
  return SECTORS[sectorId] ?? SECTORS['construction']!;
}
