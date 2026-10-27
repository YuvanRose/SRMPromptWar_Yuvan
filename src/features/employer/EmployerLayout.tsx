import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  AlertTriangle,
  Users,
  LogOut,
  Building,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useSector } from '@/lib/sector';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { OfflineBanner } from '@/components/OfflineBanner';

export function EmployerLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { profile, logout } = useAuth();
  const sector = useSector();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/employer', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/employer/attendance', icon: CalendarCheck, label: t('nav.attendance') },
    { to: '/employer/overtime', icon: Clock, label: t('nav.overtime') },
    { to: '/employer/hazards', icon: AlertTriangle, label: t('nav.hazards') },
    { to: '/employer/workers', icon: Users, label: sector.workerPluralLabel },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <OfflineBanner />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 flex-col bg-neutral-900 text-white shrink-0 border-r border-neutral-800">
          {/* Logo & Org Info */}
          <div className="p-5 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white font-black text-lg shadow-sm">
                FS
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight tracking-tight">FairShift</h1>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-primary-300 uppercase tracking-wider">
                  {sector.label}
                </span>
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-lg bg-neutral-800/80 border border-neutral-700/50">
              <p className="text-xs font-semibold text-neutral-200 truncate">{profile?.org_name}</p>
              <p className="text-[11px] text-neutral-400 truncate">{sector.siteLabel}: {profile?.site_name}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1" aria-label="Employer Navigation">
            {navItems.map((item) => {
              const isActive =
                item.to === '/employer'
                  ? location.pathname === '/employer'
                  : location.pathname.startsWith(item.to);
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/employer'}
                  className={[
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-touch',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm font-semibold'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white',
                  ].join(' ')}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer User Info */}
          <div className="p-4 border-t border-neutral-800">
            <div className="mb-3">
              <LanguageSwitcher />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="truncate mr-2">
                <p className="text-xs font-semibold text-white truncate">{profile?.full_name}</p>
                <p className="text-[11px] text-neutral-400 capitalize">{profile?.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-neutral-400 hover:text-danger-400 hover:bg-neutral-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-danger-400"
                aria-label={t('auth.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile & Tablet Header */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden bg-neutral-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-neutral-300 hover:text-white focus-visible:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <span className="font-bold text-base">FairShift</span>
              <span className="text-xs text-neutral-400 ml-1">({sector.label})</span>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher compact />
              <button
                onClick={logout}
                className="p-1.5 text-neutral-400 hover:text-danger-400"
                aria-label={t('auth.logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-neutral-900 text-white p-4 border-b border-neutral-800 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/employer'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-200 hover:bg-neutral-800 font-medium"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
export default EmployerLayout;
