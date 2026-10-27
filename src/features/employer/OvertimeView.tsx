import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  AlertTriangle,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/lib/auth';
import { useSector } from '@/lib/sector';
import { getOvertimeData } from '@/lib/seed-data';
import { Card } from '@/components/ui/Card';

type Period = 'thisWeek' | 'lastWeek' | 'thisMonth';

export function OvertimeView() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const sector = useSector();
  const [period, setPeriod] = useState<Period>('thisWeek');

  const orgId = profile?.org_id || 'demo-org-const';
  const initialData = useMemo(() => getOvertimeData(orgId), [orgId]);

  // Thresholds from sector config
  const dailyThreshold = sector.overtimeDaily; // e.g. 8h
  const weeklyThreshold = sector.overtimeWeekly; // e.g. 45h or 40h
  const multiplier = sector.overtimeMultiplier; // e.g. 1.5x

  const sortedData = useMemo(() => {
    return [...initialData].sort((a, b) => b.overtimeHours - a.overtimeHours);
  }, [initialData]);

  const flaggedCount = sortedData.filter((d) => d.totalHours > weeklyThreshold).length;

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            {t('employer.overtime.title')}
          </h2>
          <p className="text-sm text-neutral-500">
            Monitor overtime patterns and protect workers against fatigue
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center rounded-lg bg-neutral-200/80 p-1">
          {(['thisWeek', 'lastWeek', 'thisMonth'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                period === p ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900',
              ].join(' ')}
            >
              {t(`worker.hours.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Threshold Configuration Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-neutral-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary-50 text-primary-600">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Daily Overtime Rule</p>
            <p className="text-base font-bold text-neutral-900">&gt; {dailyThreshold}h / day @ {multiplier}x</p>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Weekly Fatigue Threshold</p>
            <p className="text-base font-bold text-neutral-900">&gt; {weeklyThreshold}h / week max</p>
          </div>
        </Card>

        <Card className="p-4 bg-danger-50/60 border border-danger-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-danger-100 text-danger-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-danger-600 font-medium">Fatigue Limit Exceeded</p>
            <p className="text-base font-bold text-danger-800">{flaggedCount} worker(s) flagged</p>
          </div>
        </Card>
      </div>

      {/* Overtime Distribution Chart */}
      <Card className="p-5 bg-white border border-neutral-200 shadow-xs">
        <h3 className="font-bold text-base text-neutral-900 mb-4">
          Hours Breakdown by {sector.workerLabel}
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="workerName" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="regularHours" name="Regular Hours" stackId="a" fill="#3b82f6" />
              <Bar dataKey="overtimeHours" name="Overtime Hours" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Overtime Roster Table */}
      <Card className="overflow-hidden border border-neutral-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-bold text-neutral-600 uppercase tracking-wider">
                <th className="py-3 px-4">{sector.workerLabel}</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Regular Hours</th>
                <th className="py-3 px-4">Overtime Hours</th>
                <th className="py-3 px-4">Total Hours</th>
                <th className="py-3 px-4 text-right">Fatigue Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sortedData.map((d) => {
                const exceeds = d.totalHours > weeklyThreshold;
                return (
                  <tr
                    key={d.workerId}
                    className={`hover:bg-neutral-50/80 transition-colors ${
                      exceeds ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-neutral-900">{d.workerName}</td>
                    <td className="py-3.5 px-4 text-neutral-600">{d.weekLabel}</td>
                    <td className="py-3.5 px-4 text-neutral-700">{d.regularHours}h</td>
                    <td className="py-3.5 px-4 font-bold text-amber-700">+{d.overtimeHours}h</td>
                    <td className="py-3.5 px-4 font-black text-neutral-900">{d.totalHours}h</td>
                    <td className="py-3.5 px-4 text-right">
                      {exceeds ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-danger-100 text-danger-800">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Limit Exceeded</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-50 text-success-700">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Normal</span>
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
export default OvertimeView;
