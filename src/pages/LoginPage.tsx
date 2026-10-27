import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn, HardHat, GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (userToLogin = username, passToLogin = password) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(userToLogin, passToLogin);
      const stored = localStorage.getItem('fairshift_profile');
      if (stored) {
        const profile = JSON.parse(stored);
        if (profile.role === 'employer') {
          navigate('/employer');
        } else {
          navigate('/worker');
        }
      } else {
        navigate('/worker');
      }
    } catch (err: any) {
      setError(err?.message || t('auth.error.invalid'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoUser: string) => {
    setUsername(demoUser);
    setPassword('pass123');
    handleLogin(demoUser, 'pass123');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white font-black text-2xl shadow-lg">
          FS
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-900">
          {t('app.name')}
        </h1>
        <p className="mt-1 text-sm font-medium text-neutral-500">
          {t('app.tagline')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="bg-white py-8 px-6 shadow-md border border-neutral-200 sm:rounded-2xl sm:px-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <Input
              label={t('auth.email')}
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. worker_construction"
              required
            />

            <Input
              label={t('auth.password')}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700 border border-danger-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              className="mt-2 font-bold shadow-sm"
            >
              <LogIn className="w-5 h-5" />
              <span>{isLoading ? t('common.loading') : t('auth.loginButton')}</span>
            </Button>
          </form>

          {/* One-Click Demo Logins */}
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 text-center mb-3">
              One-Click Demo Logins
            </p>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('worker_construction')}
                  className="touch-target p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 text-left transition-colors flex items-center gap-2 text-xs font-semibold text-neutral-800"
                >
                  <HardHat className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div>Construction</div>
                    <div className="text-[10px] text-neutral-500 font-normal">Worker</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('employer_construction')}
                  className="touch-target p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 text-left transition-colors flex items-center gap-2 text-xs font-semibold text-neutral-800"
                >
                  <HardHat className="w-4 h-4 text-primary-600 shrink-0" />
                  <div>
                    <div>Construction</div>
                    <div className="text-[10px] text-neutral-500 font-normal">Employer</div>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('worker_college')}
                  className="touch-target p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 text-left transition-colors flex items-center gap-2 text-xs font-semibold text-neutral-800"
                >
                  <GraduationCap className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div>College</div>
                    <div className="text-[10px] text-neutral-500 font-normal">Staff Worker</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('employer_college')}
                  className="touch-target p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 text-left transition-colors flex items-center gap-2 text-xs font-semibold text-neutral-800"
                >
                  <GraduationCap className="w-4 h-4 text-primary-600 shrink-0" />
                  <div>
                    <div>College</div>
                    <div className="text-[10px] text-neutral-500 font-normal">HOD / Employer</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
export default LoginPage;
