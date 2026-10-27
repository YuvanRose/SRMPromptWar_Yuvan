import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import type { ChangeEvent } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
] as const;

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('fairshift_language', lang);
  };

  return (
    <div className="relative inline-flex items-center shrink-0">
      <label htmlFor="language-select" className="sr-only">
        Select Language
      </label>
      <div className="absolute left-2 pointer-events-none text-neutral-500">
        <Globe className="w-3.5 h-3.5" aria-hidden="true" />
      </div>
      <select
        id="language-select"
        value={i18n.language ? i18n.language.slice(0, 2) : 'en'}
        onChange={handleLanguageChange}
        className={[
          'bg-white border border-neutral-300 text-neutral-800 rounded-md font-medium',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'cursor-pointer min-h-touch',
          compact ? 'pl-7 pr-2 py-1 text-xs max-w-[110px]' : 'pl-8 pr-4 py-2 text-sm',
        ].join(' ')}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
