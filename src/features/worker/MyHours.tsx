import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { getShiftsForWorker, type ShiftRecord } from '@/lib/seed-data';

type Period = 'thisWeek' | 'lastWeek' | 'thisMonth';

export function MyHours() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [period, setPeriod] = useState<Period>('thisWeek');

  const workerId = profile?.id || 'demo-wc-001';

  // Compute date range
  const { fromDate, toDate } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'thisWeek') {
      const from = new Date(today);
      from.setDate(today.getDate() - 6);
      return { fromDate: from, toDate: today };
    } else if (period === 'lastWeek') {
      const from = new Date(today);
      from.setDate(today.getDate() - 13);
      const to = new Date(today);
      to.setDate(today.getDate() - 7);
      return { fromDate: from, toDate: to };
    } else {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { fromDate: from, toDate: today };
    }
  }, [period]);

  const shifts = useMemo(() => {
    return getShiftsForWorker(workerId, fromDate, toDate);
  }, [workerId, fromDate, toDate]);

  // Aggregate stats
  const stats = useMemo(() => {
    let regular = 0;
    let ot = 0;
    for (const s of shifts) {
      if (s.status !== 'missed') {
        ot += s.overtimeHours;
        regular += Math.max(0, s.hoursWorked - s.overtimeHours);
      }
    }
    return {
      regular: regular.toFixed(1),
      overtime: ot.toFixed(1),
      total: (regular + ot).toFixed(1),
    };
  }, [shifts]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">{t('worker.hours.title')}</h2>
      </div>

      {/* Period Selector Tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-neutral-200 p-1">
        {(['thisWeek', 'lastWeek', 'thisMonth'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={[
              'touch-target rounded-md text-xs font-semibold py-2 transition-all',
              period === p
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900',
            ].join(' ')}
          >
            {t(`worker.hours.${p}`)}
          </button>
        ))}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center bg-white border border-neutral-200">
          <p className="text-xs text-neutral-500 font-medium">{t('worker.hours.totalHours')}</p>
          <p className="mt-1 text-lg font-bold text-neutral-900">{stats.total}h</p>
        </Card>
        <Card className="p-3 text-center bg-white border border-neutral-200">
          <p className="text-xs text-neutral-500 font-medium">{t('worker.hours.regularHours')}</p>
          <p className="mt-1 text-lg font-bold text-neutral-900">{stats.regular}h</p>
        </Card>
        <Card className="p-3 text-center bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700 font-medium">{t('worker.hours.overtimeHours')}</p>
          <p className="mt-1 text-lg font-bold text-amber-800">{stats.overtime}h</p>
        </Card>
      </div>

      {/* Shift Logs Table / List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-700 px-1">
          {t('worker.hours.title')} ({shifts.length})
        </h3>
        {shifts.length === 0 ? (
          <p className="text-sm text-neutral-500 p-4 text-center bg-white rounded-lg border border-neutral-200">
            {t('common.noData')}
          </p>
        ) : (
          shifts.map((s) => (
            <Card
              key={s.id}
              className={[
                'p-3.5 border transition-all',
                s.overtimeHours > 0 ? 'border-amber-200 bg-amber-50/40' : 'border-neutral-200 bg-white',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-neutral-900">
                    {new Date(s.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {s.actualStart ? new Date(s.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    {' - '}
                    {s.actualEnd ? new Date(s.actualEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-neutral-900">
                    {s.hoursWorked.toFixed(1)}h
                  </span>
                  {s.overtimeHours > 0 && (
                    <div className="flex items-center gap-1 justify-end text-xs font-semibold text-amber-700">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{s.overtimeHours.toFixed(1)}h OT</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
export default MyHours;
