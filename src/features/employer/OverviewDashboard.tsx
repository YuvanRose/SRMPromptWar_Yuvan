import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  CalendarCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
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
import {
  getAttendanceData,
  getOvertimeData,
  getHazardReports,
} from '@/lib/seed-data';
import { Card } from '@/components/ui/Card';

export function OverviewDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const sector = useSector();

  const orgId = profile?.org_id || 'demo-org-const';

  const attendanceData = useMemo(() => getAttendanceData(orgId), [orgId]);
  const overtimeData = useMemo(() => getOvertimeData(orgId), [orgId]);
  const hazards = useMemo(() => getHazardReports(profile?.id || '', 'employer', orgId), [profile, orgId]);

  // Aggregate high-level metrics
  const totalWorkers = orgId.includes('metrobuild') ? 45 : 22;
  const latestDay = attendanceData[attendanceData.length - 1] || { present: 40, total: 45 };
  const presentToday = latestDay.present;
  const attendanceRate = totalWorkers > 0 ? Math.round((presentToday / totalWorkers) * 100) : 0;
  const openHazards = hazards.filter((h) => h.currentStatus !== 'closed' && h.currentStatus !== 'resolved').length;
  const totalOTHours = overtimeData.reduce((acc, curr) => acc + curr.overtimeHours, 0);

  // Format attendance chart dates for readability
  const formattedAttendance = useMemo(() => {
    return attendanceData.filter(d => d.present > 0).map((d) => ({
      ...d,
      shortDate: new Date(d.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
    }));
  }, [attendanceData]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            {t('employer.overview.title')}
          </h2>
          <p className="text-sm text-neutral-500">
            {profile?.org_name} — {sector.siteLabel}: {profile?.site_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Monitoring
          </span>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Workers */}
        <Card className="p-5 bg-white border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {sector.workerPluralLabel}
            </p>
            <p className="text-2xl font-black text-neutral-900">{totalWorkers}</p>
          </div>
        </Card>

        {/* Present Today */}
        <Card className="p-5 bg-white border border-neutral-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success-50 text-success-700">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {t('employer.overview.presentToday')}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-neutral-900">{presentToday}</span>
              <span className="text-xs font-semibold text-success-700">({attendanceRate}%)</span>
            </div>
          </div>
        </Card>

        {/* Open Hazards */}
        <Card
          onClick={() => navigate('/employer/hazards')}
          className="p-5 bg-white border border-neutral-200 shadow-xs flex items-center gap-4 cursor-pointer hover:border-warning-400 transition-colors"
        >
          <div className="p-3 rounded-xl bg-warning-50 text-warning-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {t('employer.overview.openHazards')}
            </p>
            <p className="text-2xl font-black text-warning-700">{openHazards}</p>
          </div>
        </Card>

        {/* Overtime This Week */}
        <Card
          onClick={() => navigate('/employer/overtime')}
          className="p-5 bg-white border border-neutral-200 shadow-xs flex items-center gap-4 cursor-pointer hover:border-primary-400 transition-colors"
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-800">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {t('employer.overview.overtimeThisWeek')}
            </p>
            <p className="text-2xl font-black text-neutral-900">{totalOTHours}h</p>
          </div>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart (2 columns wide) */}
        <Card className="lg:col-span-2 p-5 bg-white border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-neutral-900">
                {t('employer.overview.attendanceTrend')}
              </h3>
              <p className="text-xs text-neutral-500">Daily present vs. absent records</p>
            </div>
            <button
              onClick={() => navigate('/employer/attendance')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="shortDate" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke="#1a56db"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  name="Absent"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Overtime Hotspots (1 column wide) */}
        <Card className="p-5 bg-white border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-neutral-900">
                {t('employer.overview.overtimeHotspots')}
              </h3>
              <p className="text-xs text-neutral-500">Top overtime hours</p>
            </div>
            <button
              onClick={() => navigate('/employer/overtime')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overtimeData} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis type="category" dataKey="workerName" stroke="#64748b" fontSize={10} width={75} />
                <Tooltip />
                <Bar dataKey="overtimeHours" name="OT Hours" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Hazard Reports */}
      <Card className="p-5 bg-white border border-neutral-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-neutral-900">
              {t('employer.overview.recentHazards')}
            </h3>
            <p className="text-xs text-neutral-500">Immediate attention items from workers</p>
          </div>
          <button
            onClick={() => navigate('/employer/hazards')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <span>{t('employer.hazards.title')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-neutral-100">
          {hazards.slice(0, 4).map((h) => (
            <div
              key={h.id}
              onClick={() => navigate('/employer/hazards')}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50 p-2 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-warning-100 text-warning-700 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 leading-snug">{h.title}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {t('employer.hazards.reportedBy', { name: h.reportedBy })} • {h.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                  {h.currentStatus}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-danger-50 text-danger-700 uppercase">
                  {h.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
export default OverviewDashboard;
