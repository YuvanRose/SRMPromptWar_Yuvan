import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  QrCode,
  MapPin,
  PenLine,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useFeedback } from '@/components/FeedbackToast';
import { addToOutbox } from '@/lib/sync';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type CheckInMethod = 'qr' | 'location' | 'manual';

interface CheckInFlowProps {
  onComplete: () => void;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function generateUUID(): string {
  return crypto.randomUUID();
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function CheckInFlow({ onComplete, onClose }: CheckInFlowProps) {
  const { t } = useTranslation();
  const { showSuccess, showQueued, showError } = useFeedback();

  const [method, setMethod] = useState<CheckInMethod>('qr');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR state
  const [qrScanning, setQrScanning] = useState(false);
  const [qrDone, setQrDone] = useState(false);

  // Location state
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locError, setLocError] = useState(false);

  // Manual state
  const [manualReason, setManualReason] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus / handle escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  /* ---- QR simulation ---- */
  const startQrScan = useCallback(() => {
    setQrScanning(true);
    setTimeout(() => {
      setQrScanning(false);
      setQrDone(true);
    }, 2000);
  }, []);

  /* ---- Location ---- */
  const getLocation = useCallback(() => {
    setLocating(true);
    setLocError(false);
    if (!navigator.geolocation) {
      setLocError(true);
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError(true);
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }, []);

  /* ---- Submit ---- */
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const uuid = generateUUID();
    const payload: Record<string, unknown> = {
      method,
      timestamp: new Date().toISOString(),
    };

    if (method === 'qr') payload['qrVerified'] = true;
    if (method === 'location' && coords) {
      payload['latitude'] = coords.lat;
      payload['longitude'] = coords.lng;
    }
    if (method === 'manual') payload['reason'] = manualReason;

    try {
      await addToOutbox('shift.clockIn', payload, uuid);
      if (navigator.onLine) {
        showSuccess(t('checkin.success'));
      } else {
        showQueued();
      }
      onComplete();
    } catch {
      showError();
    } finally {
      setIsSubmitting(false);
    }
  }, [method, coords, manualReason, t, showSuccess, showQueued, showError, onComplete]);

  /* ---- Can submit? ---- */
  const canSubmit =
    (method === 'qr' && qrDone) ||
    (method === 'location' && coords !== null) ||
    (method === 'manual' && manualReason.trim().length > 0);

  /* ---- Method tabs ---- */
  const methods: { key: CheckInMethod; icon: typeof QrCode; label: string }[] =
    [
      { key: 'qr', icon: QrCode, label: t('checkin.qrScan') },
      { key: 'location', icon: MapPin, label: t('checkin.location') },
      { key: 'manual', icon: PenLine, label: t('checkin.manual') },
    ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('checkin.title')}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-lg sm:rounded-2xl"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">
            {t('checkin.title')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('checkin.close')}
            className="touch-target flex items-center justify-center rounded-md p-2 text-neutral-500 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Method selector tabs */}
        <div className="mb-5 grid grid-cols-3 gap-2" role="tablist">
          {methods.map((m) => {
            const Icon = m.icon;
            const isActive = method === m.key;
            return (
              <button
                key={m.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setMethod(m.key)}
                className={[
                  'touch-target flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium',
                  'transition-colors focus-visible:ring-2 focus-visible:ring-primary-500',
                  'motion-reduce:transition-none',
                  isActive
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
                ].join(' ')}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* ---- QR Scan panel ---- */}
        {method === 'qr' && (
          <Card className="flex flex-col items-center gap-4">
            {!qrDone ? (
              <>
                <div className="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50">
                  {qrScanning ? (
                    <Loader2
                      className="h-10 w-10 animate-spin text-primary-500 motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <QrCode
                      className="h-12 w-12 text-neutral-400"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <p className="text-center text-sm text-neutral-600">
                  {qrScanning ? t('checkin.scanning') : t('checkin.scanQr')}
                </p>
                {!qrScanning && (
                  <Button variant="primary" onClick={startQrScan}>
                    {t('checkin.qrScan')}
                  </Button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-success-700">
                <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
                <p className="font-medium">{t('checkin.scanSuccess')}</p>
              </div>
            )}
          </Card>
        )}

        {/* ---- Location panel ---- */}
        {method === 'location' && (
          <Card className="flex flex-col items-center gap-4">
            {!coords ? (
              <>
                {locating ? (
                  <Loader2
                    className="h-10 w-10 animate-spin text-primary-500 motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : (
                  <MapPin
                    className="h-12 w-12 text-neutral-400"
                    aria-hidden="true"
                  />
                )}
                <p className="text-center text-sm text-neutral-600">
                  {locating
                    ? t('checkin.locating')
                    : locError
                      ? t('checkin.locationError')
                      : t('checkin.location')}
                </p>
                {!locating && (
                  <Button variant="primary" onClick={getLocation}>
                    {t('checkin.location')}
                  </Button>
                )}
              </>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <div className="flex items-center gap-2 text-success-700">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  <span className="font-medium">
                    {t('checkin.locationFound')}
                  </span>
                </div>
                <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-600">
                  <p>
                    {t('checkin.latitude')}: {coords.lat.toFixed(6)}
                  </p>
                  <p>
                    {t('checkin.longitude')}: {coords.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ---- Manual panel ---- */}
        {method === 'manual' && (
          <Card className="flex flex-col gap-3">
            <label
              htmlFor="manual-reason"
              className="text-sm font-medium text-neutral-700"
            >
              {t('checkin.manualReason')}
            </label>
            <textarea
              id="manual-reason"
              rows={3}
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={t('checkin.manualReason')}
            />
            <p className="text-xs text-warning-700">{t('checkin.manualNote')}</p>
          </Card>
        )}

        {/* ---- Submit ---- */}
        <div className="mt-5">
          <Button
            variant="success"
            size="lg"
            fullWidth
            disabled={!canSubmit || isSubmitting}
            onClick={() => void handleSubmit()}
            aria-label={t('checkin.confirmLocation')}
          >
            {isSubmitting ? (
              <Loader2
                className="h-5 w-5 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : null}
            {method === 'manual'
              ? t('checkin.submitManual')
              : t('checkin.confirmLocation')}
          </Button>
        </div>
      </div>
    </div>
  );
}
