import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Info, Download, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { getPayslipForWorker, type Payslip, type PayslipLine } from '@/lib/seed-data';

export function PayslipView() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-09');
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const workerId = profile?.id || 'demo-wc-001';
  const payslip: Payslip = useMemo(() => {
    return getPayslipForWorker(workerId, selectedPeriod);
  }, [workerId, selectedPeriod]);

  // Read aloud feature
  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const linesToSpeak = [
      `${t('worker.payslip.title')}`,
      `${t('worker.payslip.period', { period: payslip.period })}`,
      `${t('worker.payslip.netPay')}: ${payslip.netPay} rupees.`,
    ];

    payslip.earnings.forEach((item) => {
      linesToSpeak.push(`${t(item.labelKey)}: ${item.amount} rupees. ${t(item.explanationKey, item.explanationParams || {})}`);
    });

    payslip.deductions.forEach((item) => {
      linesToSpeak.push(`${t(item.labelKey)}: ${item.amount} rupees. ${t(item.explanationKey, item.explanationParams || {})}`);
    });

    const fullText = linesToSpeak.join('. ');
    const utterance = new SpeechSynthesisUtterance(fullText);

    // Try finding matching voice for language
    const voices = window.speechSynthesis.getVoices();
    const currentLang = i18n.language ? i18n.language.slice(0, 2) : 'en';
    const matchedVoice = voices.find((v) => v.lang.startsWith(currentLang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const formatCurrency = (amt: number) => {
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  const toggleExplanation = (key: string) => {
    setExpandedExplanation(expandedExplanation === key ? null : key);
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">{t('worker.payslip.title')}</h2>

        {'speechSynthesis' in window && (
          <Button
            variant={isSpeaking ? 'danger' : 'outline'}
            size="sm"
            onClick={handleReadAloud}
            className="flex items-center gap-1.5 shadow-sm"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-primary-600" />
                <span>{t('worker.payslip.readAloud')}</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Period Dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="payslip-period" className="text-sm font-medium text-neutral-700">
          Period:
        </label>
        <select
          id="payslip-period"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="2026-09">September 2026</option>
          <option value="2026-08">August 2026</option>
          <option value="2026-07">July 2026</option>
        </select>
      </div>

      {/* Net Pay Card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-wider font-semibold text-primary-200">
          {t('worker.payslip.netPay')}
        </p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight">
          {formatCurrency(payslip.netPay)}
        </p>
        <p className="mt-2 text-xs text-primary-200">
          {profile?.full_name} • {t('worker.payslip.period', { period: payslip.period })}
        </p>
      </div>

      {/* Earnings Section */}
      <Card className="border border-neutral-200 bg-white p-4">
        <h3 className="font-bold text-base text-neutral-800 border-b border-neutral-100 pb-2">
          {t('worker.payslip.earnings')}
        </h3>
        <div className="divide-y divide-neutral-100">
          {payslip.earnings.map((item: PayslipLine) => {
            const isExpanded = expandedExplanation === item.labelKey;
            return (
              <div key={item.labelKey} className="py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-800">
                      {t(item.labelKey)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExplanation(item.labelKey)}
                      aria-label="Explain line item"
                      className="text-neutral-400 hover:text-primary-600 focus-visible:outline-none"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-success-700">
                    +{formatCurrency(item.amount)}
                  </span>
                </div>
                {isExpanded && (
                  <p className="mt-1.5 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded border border-neutral-200">
                    {t(item.explanationKey, item.explanationParams || {})}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-2 border-t border-neutral-200 flex justify-between font-bold text-sm text-neutral-900">
          <span>Total {t('worker.payslip.earnings')}</span>
          <span className="text-success-700">+{formatCurrency(payslip.totalEarnings)}</span>
        </div>
      </Card>

      {/* Deductions Section */}
      <Card className="border border-neutral-200 bg-white p-4">
        <h3 className="font-bold text-base text-neutral-800 border-b border-neutral-100 pb-2">
          {t('worker.payslip.deductions')}
        </h3>
        <div className="divide-y divide-neutral-100">
          {payslip.deductions.map((item: PayslipLine) => {
            const isExpanded = expandedExplanation === item.labelKey;
            return (
              <div key={item.labelKey} className="py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-800">
                      {t(item.labelKey)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExplanation(item.labelKey)}
                      aria-label="Explain line item"
                      className="text-neutral-400 hover:text-primary-600 focus-visible:outline-none"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-danger-500">
                    -{formatCurrency(item.amount)}
                  </span>
                </div>
                {isExpanded && (
                  <p className="mt-1.5 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded border border-neutral-200">
                    {t(item.explanationKey, item.explanationParams || {})}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-2 border-t border-neutral-200 flex justify-between font-bold text-sm text-neutral-900">
          <span>Total {t('worker.payslip.deductions')}</span>
          <span className="text-danger-500">-{formatCurrency(payslip.totalDeductions)}</span>
        </div>
      </Card>
    </div>
  );
}
export default PayslipView;
