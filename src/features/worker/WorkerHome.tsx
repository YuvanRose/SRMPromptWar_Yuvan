import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Receipt,
  TrendingUp,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useSector } from '@/lib/sector';
import { getShiftsForWorker, type ShiftRecord } from '@/lib/seed-data';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import CheckInFlow from './CheckInFlow';

export function WorkerHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const sector = useSector();

  const [showCheckInFlow, setShowCheckInFlow] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(() => {
    return localStorage.getItem('fairshift_checked_in') === 'true';
  });
  const [checkInTime, setCheckInTime] = useState<string | null>(() => {
    return localStorage.getItem('fairshift_checkin_time');
  });

  const workerId = profile?.id || 'demo-wc-001';

  // Fetch recent shifts
  const recentShifts = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 1);
    return getShiftsForWorker(workerId, start, today);
  }, [workerId]);

  const defaultShift = sector.shiftPatterns[0];
  const scheduledTimeStr = defaultShift ? `${defaultShift.startHour}:00 - ${defaultShift.endHour}:00` : '08:00 - 17:00';

  const handleCheckInComplete = () => {
    setShowCheckInFlow(false);
    setIsCheckedIn(true);
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCheckInTime(timeNow);
    localStorage.setItem('fairshift_checked_in', 'true');
    localStorage.setItem('fairshift_checkin_time', timeNow);
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setCheckInTime(null);
    localStorage.removeItem('fairshift_checked_in');
    localStorage.removeItem('fairshift_checkin_time');
  };

  const todayDateFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Greeting Banner */}
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 p-5 text-white shadow-md">
        <p className="text-xs font-medium uppercase tracking-wider text-primary-200">
          {todayDateFormatted}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">
          {t('worker.home.greeting', { name: profile?.full_name || 'Worker' })}
        </h2>
        <p className="mt-1 text-sm text-primary-100">
          {profile?.site_name} • {profile?.org_name}
        </p>
      </div>

      {/* Today's Shift Card */}
      <Card className="border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            <h3 className="font-semibold text-neutral-800">{t('worker.home.todayShift')}</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800">
            {sector.label}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Clock className="h-4 w-4 text-neutral-400" />
            <span>{scheduledTimeStr}</span>
          </div>
          {isCheckedIn && checkInTime && (
            <span className="text-xs font-medium text-success-700 bg-success-50 px-2 py-1 rounded">
              {t('worker.home.checkedIn', { time: checkInTime })}
            </span>
          )}
        </div>

        {/* Big Action Button */}
        <div className="mt-4">
          {!isCheckedIn ? (
            <Button
              variant="success"
              size="lg"
              fullWidth
              onClick={() => setShowCheckInFlow(true)}
              className="text-lg font-bold shadow-md hover:shadow-lg transition-all"
            >
              <LogIn className="h-6 w-6 stroke-[2.5]" />
              <span>{t('worker.home.checkIn')}</span>
            </Button>
          ) : (
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={handleCheckOut}
              className="text-lg font-bold shadow-md hover:shadow-lg transition-all"
            >
              <LogOut className="h-6 w-6 stroke-[2.5]" />
              <span>{t('worker.home.checkOut')}</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        <button
          onClick={() => navigate('/worker/report')}
          className="touch-target flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-center shadow-sm hover:border-warning-400 hover:bg-warning-50 transition-all focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 text-warning-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold text-neutral-800">
            {t('nav.report')}
          </span>
        </button>

        <button
          onClick={() => navigate('/worker/payslip')}
          className="touch-target flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-center shadow-sm hover:border-primary-400 hover:bg-primary-50 transition-all focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <Receipt className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold text-neutral-800">
            {t('nav.payslip')}
          </span>
        </button>
      </div>

      {/* Modal for check-in flow */}
      {showCheckInFlow && (
        <CheckInFlow
          onComplete={handleCheckInComplete}
          onClose={() => setShowCheckInFlow(false)}
        />
      )}
    </div>
  );
}
export default WorkerHome;
