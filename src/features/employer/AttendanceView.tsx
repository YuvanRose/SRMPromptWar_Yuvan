import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  CheckCircle2,
  Clock,
  QrCode,
  MapPin,
  PenLine,
  Filter,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useSector } from '@/lib/sector';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFeedback } from '@/components/FeedbackToast';

interface AttendanceRow {
  id: string;
  workerName: string;
  role: string;
  siteName: string;
  inTime: string | null;
  outTime: string | null;
  hoursWorked: number;
  method: 'qr' | 'location' | 'manual' | null;
  status: 'present' | 'late' | 'absent';
  manualApproved?: boolean;
}

export function AttendanceView() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const sector = useSector();
  const { showSuccess } = useFeedback();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const isConstruction = profile?.org_id.includes('metrobuild');

  // Realistic sample worker attendance records
  const [rows, setRows] = useState<AttendanceRow[]>(() => {
    if (isConstruction) {
      return [
        {
          id: 'att-1',
          workerName: 'Rajesh Kumar',
          role: 'Mason Foreman',
          siteName: 'Site Alpha',
          inTime: '07:54 AM',
          outTime: '06:15 PM',
          hoursWorked: 10.3,
          method: 'qr',
          status: 'present',
        },
        {
          id: 'att-2',
          workerName: 'Sunil Yadav',
          role: 'Bar Bender',
          siteName: 'Site Alpha',
          inTime: '08:22 AM',
          outTime: '05:05 PM',
          hoursWorked: 8.7,
          method: 'location',
          status: 'late',
        },
        {
          id: 'att-3',
          workerName: 'Mohammed Farooq',
          role: 'Crane Operator',
          siteName: 'Site Alpha',
          inTime: '07:45 AM',
          outTime: '05:45 PM',
          hoursWorked: 10.0,
          method: 'qr',
          status: 'present',
        },
        {
          id: 'att-4',
          workerName: 'Deepak Paswan',
          role: 'Scaffolder',
          siteName: 'Site Alpha',
          inTime: '08:00 AM',
          outTime: '05:00 PM',
          hoursWorked: 9.0,
          method: 'manual',
          status: 'present',
          manualApproved: false,
        },
        {
          id: 'att-5',
          workerName: 'Lakshmi Devi',
          role: 'Safety Helper',
          siteName: 'Site Alpha',
          inTime: null,
          outTime: null,
          hoursWorked: 0,
          method: null,
          status: 'absent',
        },
      ];
    } else {
      return [
        {
          id: 'att-10',
          workerName: 'Priya Venkatesh',
          role: 'Assistant Professor',
          siteName: 'CS Department',
          inTime: '08:50 AM',
          outTime: '05:15 PM',
          hoursWorked: 8.4,
          method: 'qr',
          status: 'present',
        },
        {
          id: 'att-11',
          workerName: 'Arjun Nair',
          role: 'Lab Instructor',
          siteName: 'CS Department',
          inTime: '09:12 AM',
          outTime: '05:00 PM',
          hoursWorked: 7.8,
          method: 'location',
          status: 'late',
        },
        {
          id: 'att-12',
          workerName: 'Meenakshi Sundaram',
          role: 'Department Assistant',
          siteName: 'CS Department',
          inTime: '08:45 AM',
          outTime: '05:00 PM',
          hoursWorked: 8.2,
          method: 'manual',
          status: 'present',
          manualApproved: false,
        },
        {
          id: 'att-13',
          workerName: 'Karthik Raja',
          role: 'Network Technician',
          siteName: 'CS Department',
          inTime: null,
          outTime: null,
          hoursWorked: 0,
          method: null,
          status: 'absent',
        },
      ];
    }
  });

  const handleApprove = (id: string, name: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, manualApproved: true } : r))
    );
    showSuccess(`Approved manual entry for ${name}`);
  };

  const filteredRows = useMemo(() => {
    if (methodFilter === 'all') return rows;
    if (methodFilter === 'manual') return rows.filter((r) => r.method === 'manual');
    if (methodFilter === 'qr') return rows.filter((r) => r.method === 'qr');
    if (methodFilter === 'location') return rows.filter((r) => r.method === 'location');
    return rows;
  }, [rows, methodFilter]);

  const summary = useMemo(() => {
    const present = rows.filter((r) => r.status === 'present').length;
    const late = rows.filter((r) => r.status === 'late').length;
    const absent = rows.filter((r) => r.status === 'absent').length;
    return { present, late, absent, total: rows.length };
  }, [rows]);

  const getMethodIcon = (m: AttendanceRow['method']) => {
    switch (m) {
      case 'qr':
        return <QrCode className="w-4 h-4 text-primary-600" title="QR Check-in" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-emerald-600" title="Location Check-in" />;
      case 'manual':
        return <PenLine className="w-4 h-4 text-amber-600" title="Manual Check-in" />;
      default:
        return <span className="text-neutral-400">—</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            {t('employer.attendance.title')}
          </h2>
          <p className="text-sm text-neutral-500">
            Monitor daily logs and verify manual fallbacks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-lg px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-semibold text-neutral-800 bg-transparent focus:outline-none"
            />
          </div>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-sm font-semibold text-neutral-800 bg-white border border-neutral-300 rounded-lg px-3 py-2 shadow-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All Methods</option>
            <option value="qr">QR Code</option>
            <option value="location">Location GPS</option>
            <option value="manual">Manual Fallback</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4 bg-white border border-neutral-200 text-center">
          <p className="text-xs text-neutral-500 uppercase font-semibold">Total Logged</p>
          <p className="text-2xl font-black text-neutral-900 mt-1">{summary.total}</p>
        </Card>
        <Card className="p-4 bg-success-50/60 border border-success-200 text-center">
          <p className="text-xs text-success-700 uppercase font-semibold">Present</p>
          <p className="text-2xl font-black text-success-800 mt-1">{summary.present}</p>
        </Card>
        <Card className="p-4 bg-amber-50/60 border border-amber-200 text-center">
          <p className="text-xs text-amber-700 uppercase font-semibold">Late</p>
          <p className="text-2xl font-black text-amber-800 mt-1">{summary.late}</p>
        </Card>
        <Card className="p-4 bg-danger-50/60 border border-danger-200 text-center">
          <p className="text-xs text-danger-700 uppercase font-semibold">Absent</p>
          <p className="text-2xl font-black text-danger-800 mt-1">{summary.absent}</p>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="overflow-hidden border border-neutral-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-bold text-neutral-600 uppercase tracking-wider">
                <th className="py-3 px-4">{sector.workerLabel}</th>
                <th className="py-3 px-4">{sector.siteLabel}</th>
                <th className="py-3 px-4">In Time</th>
                <th className="py-3 px-4">Out Time</th>
                <th className="py-3 px-4">Worked</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredRows.map((row) => {
                const isManualPending = row.method === 'manual' && !row.manualApproved;
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-neutral-50/80 transition-colors ${
                      isManualPending ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-neutral-900">
                      <div>{row.workerName}</div>
                      <div className="text-xs text-neutral-400 font-normal">{row.role}</div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600">{row.siteName}</td>
                    <td className="py-3.5 px-4 font-medium text-neutral-800">
                      {row.inTime || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-neutral-800">
                      {row.outTime || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-neutral-900">
                      {row.hoursWorked > 0 ? `${row.hoursWorked}h` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {getMethodIcon(row.method)}
                        <span className="text-xs capitalize text-neutral-600">
                          {row.method || 'None'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {row.status === 'present' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-50 text-success-700">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Present</span>
                        </span>
                      )}
                      {row.status === 'late' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>Late</span>
                        </span>
                      )}
                      {row.status === 'absent' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-danger-50 text-danger-700">
                          <span>Absent</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isManualPending && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(row.id, row.workerName)}
                          className="text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('employer.attendance.approveManual')}</span>
                        </Button>
                      )}
                      {row.method === 'manual' && row.manualApproved && (
                        <span className="text-xs font-semibold text-success-700 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('employer.attendance.approved')}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
export default AttendanceView;
