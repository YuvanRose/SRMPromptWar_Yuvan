import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { SkeletonCard, SkeletonList } from '@/components/ui/SkeletonLoader';

// Lazy-loaded layouts & pages
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const WorkerLayout = lazy(() => import('@/features/worker/WorkerLayout'));
const WorkerHome = lazy(() => import('@/features/worker/WorkerHome'));
const MyHours = lazy(() => import('@/features/worker/MyHours'));
const PayslipView = lazy(() => import('@/features/worker/PayslipView'));
const ReportHazard = lazy(() => import('@/features/worker/ReportHazard'));
const MyReports = lazy(() => import('@/features/worker/MyReports'));

const EmployerLayout = lazy(() => import('@/features/employer/EmployerLayout'));
const OverviewDashboard = lazy(() => import('@/features/employer/OverviewDashboard'));
const AttendanceView = lazy(() => import('@/features/employer/AttendanceView'));
const OvertimeView = lazy(() => import('@/features/employer/OvertimeView'));
const HazardInbox = lazy(() => import('@/features/employer/HazardInbox'));
const WorkersView = lazy(() => import('@/features/employer/WorkersView'));

function PageFallback() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <SkeletonCard className="h-28 w-full" />
      <SkeletonList count={3} />
    </div>
  );
}

function ProtectedWorkerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <PageFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === 'employer') return <Navigate to="/employer" replace />;
  return <>{children}</>;
}

function ProtectedEmployerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <PageFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === 'worker') return <Navigate to="/worker" replace />;
  return <>{children}</>;
}

export function App() {
  const { user, profile } = useAuth();

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Worker Interface */}
        <Route
          path="/worker"
          element={
            <ProtectedWorkerRoute>
              <WorkerLayout />
            </ProtectedWorkerRoute>
          }
        >
          <Route index element={<WorkerHome />} />
          <Route path="hours" element={<MyHours />} />
          <Route path="payslip" element={<PayslipView />} />
          <Route path="report" element={<ReportHazard />} />
          <Route path="my-reports" element={<MyReports />} />
        </Route>

        {/* Employer Interface */}
        <Route
          path="/employer"
          element={
            <ProtectedEmployerRoute>
              <EmployerLayout />
            </ProtectedEmployerRoute>
          }
        >
          <Route index element={<OverviewDashboard />} />
          <Route path="attendance" element={<AttendanceView />} />
          <Route path="overtime" element={<OvertimeView />} />
          <Route path="hazards" element={<HazardInbox />} />
          <Route path="workers" element={<WorkersView />} />
        </Route>

        {/* Root Redirect based on Auth */}
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : profile?.role === 'employer' ? (
              <Navigate to="/employer" replace />
            ) : (
              <Navigate to="/worker" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
export default App;
