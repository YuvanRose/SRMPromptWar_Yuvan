import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Clock,
  Receipt,
  AlertTriangle,
  FileText,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { OfflineBanner } from '@/components/OfflineBanner';

const NAV_ITEMS = [
  { to: '/worker', icon: Home, labelKey: 'nav.home' },
  { to: '/worker/hours', icon: Clock, labelKey: 'nav.hours' },
  { to: '/worker/payslip', icon: Receipt, labelKey: 'nav.payslip' },
  { to: '/worker/report', icon: AlertTriangle, labelKey: 'nav.report' },
  { to: '/worker/my-reports', icon: FileText, labelKey: 'nav.myReports' },
] as const;

export function WorkerLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { profile, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 pb-20">
      <OfflineBanner />

      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white font-bold shadow-sm">
            FS
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-neutral-900">
              {t('app.name')}
            </h1>
            <p className="text-xs text-neutral-500">{profile?.site_name || profile?.org_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="User Profile"
              aria-expanded={profileOpen}
            >
              <User className="h-5 w-5 text-neutral-700" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white p-3 shadow-lg border border-neutral-200 z-50 animate-in fade-in">
                <p className="font-semibold text-sm text-neutral-900">{profile?.full_name}</p>
                <p className="text-xs text-neutral-500 mb-3">{profile?.org_name}</p>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-danger-500 hover:bg-danger-50 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('auth.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white shadow-lg"
      >
        <ul className="flex items-center justify-around max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.to === '/worker'
                ? location.pathname === '/worker'
                : location.pathname.startsWith(item.to);
            const Icon = item.icon;

            return (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.to === '/worker'}
                  className={[
                    'flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5',
                    'touch-target text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
                    isActive
                      ? 'text-primary-600 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-800',
                  ].join(' ')}
                >
                  <Icon
                    className={[
                      'h-5 w-5',
                      isActive ? 'text-primary-600 stroke-[2.5]' : 'text-neutral-400',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
export default WorkerLayout;
