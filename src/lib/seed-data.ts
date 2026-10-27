/* ------------------------------------------------------------------ */
/*  FairShift — Comprehensive Seed / Demo Data                        */
/*  Provides realistic data for offline-first demo mode.              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Helper utilities                                                  */
/* ------------------------------------------------------------------ */
function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isoStr(d: Date): string {
  return d.toISOString();
}

/** Deterministic "random" from a seed string for repeatability */
function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 1000) / 1000;
}

/* ------------------------------------------------------------------ */
/*  Shift data                                                        */
/* ------------------------------------------------------------------ */
export interface ShiftRecord {
  id: string;
  workerId: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  status: 'completed' | 'missed' | 'late' | 'upcoming';
  hoursWorked: number;
  overtimeHours: number;
  notes: string;
}

export function getShiftsForWorker(
  workerId: string,
  fromDate: Date,
  toDate: Date,
): ShiftRecord[] {
  const shifts: ShiftRecord[] = [];
  const isConstruction = workerId.includes('wc');
  const startHour = isConstruction ? 8 : 9;
  const endHour = isConstruction ? 17 : 17;
  const current = new Date(fromDate);

  while (current <= toDate) {
    const day = current.getDay();
    const ds = dateStr(current);
    const seed = `${workerId}-${ds}`;
    const rand = seededRandom(seed);

    // Skip Sundays for construction, Sun + Sat for college
    const isOff = isConstruction ? day === 0 : day === 0 || day === 6;

    if (!isOff) {
      const isFuture = current > new Date();

      if (isFuture) {
        shifts.push({
          id: `shift-${seed}`,
          workerId,
          date: ds,
          scheduledStart: `${ds}T${String(startHour).padStart(2, '0')}:00:00`,
          scheduledEnd: `${ds}T${String(endHour).padStart(2, '0')}:00:00`,
          actualStart: null,
          actualEnd: null,
          status: 'upcoming',
          hoursWorked: 0,
          overtimeHours: 0,
          notes: '',
        });
      } else if (rand < 0.08) {
        // ~8% missed days
        shifts.push({
          id: `shift-${seed}`,
          workerId,
          date: ds,
          scheduledStart: `${ds}T${String(startHour).padStart(2, '0')}:00:00`,
          scheduledEnd: `${ds}T${String(endHour).padStart(2, '0')}:00:00`,
          actualStart: null,
          actualEnd: null,
          status: 'missed',
          hoursWorked: 0,
          overtimeHours: 0,
          notes: rand < 0.04 ? 'Sick leave' : 'Absent — no prior notice',
        });
      } else {
        const lateMinutes = rand > 0.75 ? Math.floor(rand * 45) + 5 : 0;
        const otHours = rand > 0.6 ? Math.floor(rand * 4) : 0;
        const actualStartH = startHour;
        const actualStartM = lateMinutes;
        const actualEndH = endHour + otHours;
        const worked = actualEndH - actualStartH - actualStartM / 60;

        shifts.push({
          id: `shift-${seed}`,
          workerId,
          date: ds,
          scheduledStart: `${ds}T${String(startHour).padStart(2, '0')}:00:00`,
          scheduledEnd: `${ds}T${String(endHour).padStart(2, '0')}:00:00`,
          actualStart: `${ds}T${String(actualStartH).padStart(2, '0')}:${String(actualStartM).padStart(2, '0')}:00`,
          actualEnd: `${ds}T${String(actualEndH).padStart(2, '0')}:00:00`,
          status: lateMinutes > 0 ? 'late' : 'completed',
          hoursWorked: Math.round(worked * 100) / 100,
          overtimeHours: otHours,
          notes: lateMinutes > 0 ? `Checked in ${lateMinutes} min late` : '',
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return shifts;
}

/* ------------------------------------------------------------------ */
/*  Payslip data                                                      */
/* ------------------------------------------------------------------ */
export interface PayslipLine {
  label: string;
  amount: number;
  type: 'earning' | 'deduction';
  explanation: string;
}

export interface Payslip {
  id: string;
  workerId: string;
  period: string;
  periodLabel: string;
  lines: PayslipLine[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  paidOn: string;
  status: 'paid' | 'pending';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function getPayslipForWorker(workerId: string, period: string): Payslip {
  const isConstruction = workerId.includes('wc');
  const parts = period.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const monthName = MONTH_NAMES[month] ?? 'Unknown';

  if (isConstruction) {
    const daysWorked = 24 + Math.floor(seededRandom(`${workerId}-${period}-days`) * 3);
    const dailyRate = 800;
    const basic = daysWorked * dailyRate;
    const otHours = Math.floor(seededRandom(`${workerId}-${period}-ot`) * 20);
    const otRate = Math.round((dailyRate / 8) * 2);
    const otPay = otHours * otRate;
    const hra = Math.round(basic * 0.1);
    const pfDeduction = Math.round(basic * 0.12);
    const esiDeduction = Math.round((basic + hra) * 0.0075);

    const lines: PayslipLine[] = [
      { label: 'Basic Wage', amount: basic, type: 'earning', explanation: `${daysWorked} days × ₹${dailyRate}/day` },
      { label: 'HRA', amount: hra, type: 'earning', explanation: '10% of Basic Wage as housing allowance' },
      { label: 'Overtime', amount: otPay, type: 'earning', explanation: `${otHours} hrs × ₹${otRate}/hr (2× regular rate as per law)` },
      { label: 'PF (Employee)', amount: pfDeduction, type: 'deduction', explanation: "12% of Basic Wage — Employees' Provident Fund" },
      { label: 'ESI', amount: esiDeduction, type: 'deduction', explanation: '0.75% of gross — Employee State Insurance' },
    ];

    const gross = basic + hra + otPay;
    const deductions = pfDeduction + esiDeduction;

    return {
      id: `payslip-${workerId}-${period}`,
      workerId,
      period,
      periodLabel: `${monthName} ${year}`,
      lines,
      grossPay: gross,
      totalDeductions: deductions,
      netPay: gross - deductions,
      paidOn: `${year}-${String(month + 2).padStart(2, '0')}-05`,
      status: 'paid',
    };
  }

  // College staff: ₹35,000/month salary
  const basic = 35000;
  const hra = Math.round(basic * 0.2);
  const da = Math.round(basic * 0.17);
  const ta = 1600;
  const pfDeduction = Math.round(basic * 0.12);
  const professionalTax = 200;
  const tds = Math.round((basic + hra + da) * 0.1);

  const lines: PayslipLine[] = [
    { label: 'Basic Pay', amount: basic, type: 'earning', explanation: 'Monthly basic salary as per appointment' },
    { label: 'HRA', amount: hra, type: 'earning', explanation: '20% of Basic Pay — House Rent Allowance' },
    { label: 'Dearness Allowance', amount: da, type: 'earning', explanation: '17% of Basic Pay — DA as per latest revision' },
    { label: 'Transport Allowance', amount: ta, type: 'earning', explanation: 'Fixed monthly conveyance allowance' },
    { label: 'PF (Employee)', amount: pfDeduction, type: 'deduction', explanation: "12% of Basic Pay — Employees' Provident Fund" },
    { label: 'Professional Tax', amount: professionalTax, type: 'deduction', explanation: 'State professional tax' },
    { label: 'TDS', amount: tds, type: 'deduction', explanation: '10% of (Basic + HRA + DA) — Tax Deducted at Source' },
  ];

  const gross = basic + hra + da + ta;
  const deductions = pfDeduction + professionalTax + tds;

  return {
    id: `payslip-${workerId}-${period}`,
    workerId,
    period,
    periodLabel: `${monthName} ${year}`,
    lines,
    grossPay: gross,
    totalDeductions: deductions,
    netPay: gross - deductions,
    paidOn: `${year}-${String(month + 2).padStart(2, '0')}-01`,
    status: 'paid',
  };
}

/* ------------------------------------------------------------------ */
/*  Hazard / Safety reports                                           */
/* ------------------------------------------------------------------ */
export interface HazardStatusEntry {
  status: string;
  timestamp: string;
  by: string;
  note: string;
}

export interface HazardReport {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  reportedAt: string;
  location: string;
  currentStatus: 'open' | 'investigating' | 'resolved' | 'closed';
  statusHistory: HazardStatusEntry[];
  photoUrl: string | null;
}

export function getHazardReports(
  _userId: string,
  _role: 'worker' | 'employer',
  orgId: string,
): HazardReport[] {
  const isConstruction = orgId.includes('metrobuild');
  const now = new Date();

  if (isConstruction) {
    return [
      {
        id: 'haz-c-001',
        title: 'Loose scaffolding at Block C, Level 3',
        description: 'Two scaffolding clamps are rusted and not tightened. Workers reported swaying when climbing. Urgent fix needed before next shift.',
        type: 'Structural instability',
        severity: 'critical',
        reportedBy: 'Rajesh Kumar',
        reportedAt: isoStr(new Date(now.getTime() - 2 * 86_400_000)),
        location: 'Block C, Level 3',
        currentStatus: 'investigating',
        statusHistory: [
          { status: 'open', timestamp: isoStr(new Date(now.getTime() - 2 * 86_400_000)), by: 'Rajesh Kumar', note: 'Reported via FairShift app with photo evidence' },
          { status: 'investigating', timestamp: isoStr(new Date(now.getTime() - 1.5 * 86_400_000)), by: 'Anita Sharma', note: 'Safety officer dispatched. Area cordoned off.' },
        ],
        photoUrl: null,
      },
      {
        id: 'haz-c-002',
        title: 'Exposed wiring near water source',
        description: 'Electrical cables running through the ground floor pantry area have damaged insulation. Rain water pooling nearby.',
        type: 'Electrical hazard',
        severity: 'high',
        reportedBy: 'Mohammed Farooq',
        reportedAt: isoStr(new Date(now.getTime() - 5 * 86_400_000)),
        location: 'Ground Floor, Pantry',
        currentStatus: 'resolved',
        statusHistory: [
          { status: 'open', timestamp: isoStr(new Date(now.getTime() - 5 * 86_400_000)), by: 'Mohammed Farooq', note: 'Reported during evening shift' },
          { status: 'investigating', timestamp: isoStr(new Date(now.getTime() - 4.5 * 86_400_000)), by: 'Anita Sharma', note: 'Electrician called in' },
          { status: 'resolved', timestamp: isoStr(new Date(now.getTime() - 4 * 86_400_000)), by: 'Anita Sharma', note: 'All cables re-routed and insulated. Drainage fixed.' },
        ],
        photoUrl: null,
      },
      {
        id: 'haz-c-003',
        title: 'Heat stress — no shade at mixing area',
        description: 'Concrete mixing area has no shade cover. Temperature readings above 42°C during afternoon. Two workers reported dizziness.',
        type: 'Heat stress',
        severity: 'medium',
        reportedBy: 'Rajesh Kumar',
        reportedAt: isoStr(new Date(now.getTime() - 1 * 86_400_000)),
        location: 'Mixing Area, East Wing',
        currentStatus: 'open',
        statusHistory: [
          { status: 'open', timestamp: isoStr(new Date(now.getTime() - 1 * 86_400_000)), by: 'Rajesh Kumar', note: 'Workers requested shade and water breaks' },
        ],
        photoUrl: null,
      },
    ];
  }

  // College
  return [
    {
      id: 'haz-u-001',
      title: 'Chemical spill in Chemistry Lab 2B',
      description: 'Sulphuric acid container leaked due to cracked cap. Small pool formed near Bench 4. Students evacuated safely.',
      type: 'Lab chemical spill',
      severity: 'high',
      reportedBy: 'Priya Venkatesh',
      reportedAt: isoStr(new Date(now.getTime() - 3 * 86_400_000)),
      location: 'Chemistry Lab 2B',
      currentStatus: 'resolved',
      statusHistory: [
        { status: 'open', timestamp: isoStr(new Date(now.getTime() - 3 * 86_400_000)), by: 'Priya Venkatesh', note: 'Reported immediately after discovery' },
        { status: 'investigating', timestamp: isoStr(new Date(now.getTime() - 2.8 * 86_400_000)), by: 'Dr. Suresh Iyer', note: 'Cleanup team deployed. Container replaced.' },
        { status: 'resolved', timestamp: isoStr(new Date(now.getTime() - 2.5 * 86_400_000)), by: 'Dr. Suresh Iyer', note: 'Area cleaned, all containers inspected and secured.' },
      ],
      photoUrl: null,
    },
    {
      id: 'haz-u-002',
      title: 'Broken fire exit sign, Admin Block',
      description: 'Emergency exit sign on 2nd floor is non-functional. Bulb dead. Could cause confusion during evacuation.',
      type: 'Fire safety violation',
      severity: 'medium',
      reportedBy: 'Priya Venkatesh',
      reportedAt: isoStr(new Date(now.getTime() - 7 * 86_400_000)),
      location: 'Admin Block, 2nd Floor',
      currentStatus: 'closed',
      statusHistory: [
        { status: 'open', timestamp: isoStr(new Date(now.getTime() - 7 * 86_400_000)), by: 'Priya Venkatesh', note: 'Noticed during routine check' },
        { status: 'resolved', timestamp: isoStr(new Date(now.getTime() - 6 * 86_400_000)), by: 'Maintenance Dept', note: 'Sign replaced with LED model' },
        { status: 'closed', timestamp: isoStr(new Date(now.getTime() - 5 * 86_400_000)), by: 'Dr. Suresh Iyer', note: 'Verified during walk-through' },
      ],
      photoUrl: null,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Attendance dashboard data                                         */
/* ------------------------------------------------------------------ */
export interface AttendanceDay {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

export function getAttendanceData(orgId: string): AttendanceDay[] {
  const isConstruction = orgId.includes('metrobuild');
  const total = isConstruction ? 45 : 22;
  const data: AttendanceDay[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const day = d.getDay();
    const isOff = isConstruction ? day === 0 : day === 0 || day === 6;

    if (isOff) {
      data.push({ date: ds, present: 0, absent: 0, late: 0, total });
    } else {
      const rand = seededRandom(`att-${orgId}-${ds}`);
      const absent = Math.floor(rand * (isConstruction ? 6 : 3));
      const late = Math.floor(seededRandom(`late-${orgId}-${ds}`) * (isConstruction ? 5 : 2));
      const present = total - absent - late;
      data.push({ date: ds, present, absent, late, total });
    }
  }

  return data;
}

/* ------------------------------------------------------------------ */
/*  Overtime hotspot data                                             */
/* ------------------------------------------------------------------ */
export interface OvertimeEntry {
  workerId: string;
  workerName: string;
  weekLabel: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  flagged: boolean;
}

export function getOvertimeData(orgId: string): OvertimeEntry[] {
  const isConstruction = orgId.includes('metrobuild');

  if (isConstruction) {
    return [
      { workerId: 'w-001', workerName: 'Rajesh Kumar', weekLabel: 'This week', regularHours: 48, overtimeHours: 12, totalHours: 60, flagged: true },
      { workerId: 'w-002', workerName: 'Mohammed Farooq', weekLabel: 'This week', regularHours: 48, overtimeHours: 8, totalHours: 56, flagged: true },
      { workerId: 'w-003', workerName: 'Sunil Yadav', weekLabel: 'This week', regularHours: 44, overtimeHours: 4, totalHours: 48, flagged: false },
      { workerId: 'w-004', workerName: 'Deepak Paswan', weekLabel: 'This week', regularHours: 48, overtimeHours: 6, totalHours: 54, flagged: true },
      { workerId: 'w-005', workerName: 'Lakshmi Devi', weekLabel: 'This week', regularHours: 40, overtimeHours: 0, totalHours: 40, flagged: false },
    ];
  }

  return [
    { workerId: 's-001', workerName: 'Priya Venkatesh', weekLabel: 'This week', regularHours: 40, overtimeHours: 6, totalHours: 46, flagged: true },
    { workerId: 's-002', workerName: 'Arjun Nair', weekLabel: 'This week', regularHours: 40, overtimeHours: 3, totalHours: 43, flagged: false },
    { workerId: 's-003', workerName: 'Kavitha Raman', weekLabel: 'This week', regularHours: 38, overtimeHours: 0, totalHours: 38, flagged: false },
    { workerId: 's-004', workerName: 'Bala Murugan', weekLabel: 'This week', regularHours: 40, overtimeHours: 8, totalHours: 48, flagged: true },
  ];
}
