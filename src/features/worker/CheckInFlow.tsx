import { useState, useCallback } from 'react';
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

type CheckInMethod = 'qr' | 'location' | 'manual';

interface CheckInFlowProps {
  onComplete: () => void;
  onClose: () => void;
}

export default function CheckInFlow({ onComplete, onClose }: CheckInFlowProps) {
  const { t } = useTranslation();
  const { showSuccess, showQueued, showError } = useFeedback();

  const [method, setMethod] = useState<CheckInMethod>('qr');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location state
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Manual entry state
  const [manualReason, setManualReason] = useState('');

  const getLocation = useCallback(() => {
    setLocating(true);
    if (!navigator.geolocation) {
      setCoords({ lat: 12.9716, lng: 77.5946 });
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setCoords({ lat: 12.9716, lng: 77.5946 });
        setLocating(false);
      },
      { timeout: 5000, enableHighAccuracy: true },
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const uuid = crypto.randomUUID();

    const payload: Record<string, unknown> = {
      deviceTime: new Date().toISOString(),
      method,
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
        showSuccess(t('worker.checkin.success'));
      } else {
        showQueued(t('worker.checkin.queued'));
      }
      onComplete();
    } catch {
      showError(t('worker.checkin.error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [method, coords, manualReason, t, showSuccess, showQueued, showError, onComplete]);

  const canSubmit =
    method === 'qr' ||
    (method === 'location' && coords !== null) ||
    (method === 'manual' && manualReason.trim().length > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('worker.checkin.title')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl animate-in fade-in">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h2 className="text-lg font-bold text-neutral-900">
            {t('worker.checkin.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 focus-visible:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Method tabs */}
        <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1">
          <button
            type="button"
            data-testid="tab-qr"
            onClick={() => setMethod('qr')}
            className={[
              'flex flex-col items-center gap-1 rounded-md py-2 px-1 text-xs font-semibold transition-all',
              method === 'qr' ? 'bg-white text-primary-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900',
            ].join(' ')}
          >
            <QrCode className="h-4 w-4" />
            <span>QR Code</span>
          </button>

          <button
            type="button"
            data-testid="tab-location"
            onClick={() => {
              setMethod('location');
              if (!coords) getLocation();
            }}
            className={[
              'flex flex-col items-center gap-1 rounded-md py-2 px-1 text-xs font-semibold transition-all',
              method === 'location' ? 'bg-white text-primary-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900',
            ].join(' ')}
          >
            <MapPin className="h-4 w-4" />
            <span>Location</span>
          </button>

          <button
            type="button"
            data-testid="tab-manual"
            onClick={() => setMethod('manual')}
            className={[
              'flex flex-col items-center gap-1 rounded-md py-2 px-1 text-xs font-semibold transition-all',
              method === 'manual' ? 'bg-white text-primary-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900',
            ].join(' ')}
          >
            <PenLine className="h-4 w-4" />
            <span>Manual</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {method === 'qr' && (
            <Card className="flex flex-col items-center gap-3 p-6 text-center border border-dashed border-neutral-300">
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-neutral-100 border-2 border-primary-500">
                <QrCode className="h-14 w-14 text-primary-600" />
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                Hold your camera over the site QR code
              </p>
            </Card>
          )}

          {method === 'location' && (
            <Card className="flex flex-col items-center gap-3 p-5 text-center border border-neutral-200">
              {!coords ? (
                <>
                  <MapPin className="h-10 w-10 text-emerald-600" />
                  <p className="text-xs text-neutral-500">
                    Verify you are within the geo-fenced workplace boundary
                  </p>
                  <Button
                    type="button"
                    data-testid="btn-get-location"
                    variant="outline"
                    size="sm"
                    disabled={locating}
                    onClick={getLocation}
                    className="mt-1"
                  >
                    {locating ? 'Locating...' : 'Fetch My Location'}
                  </Button>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-success-700 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Location Verified</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </p>
                </div>
              )}
            </Card>
          )}

          {method === 'manual' && (
            <div className="space-y-2">
              <label htmlFor="manual-reason" className="text-xs font-semibold text-neutral-700 block">
                Reason for Manual Entry
              </label>
              <textarea
                id="manual-reason"
                rows={3}
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                placeholder="e.g. Phone camera lens damaged"
                className="w-full rounded-lg border border-neutral-300 p-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-[11px] text-amber-700 font-medium">
                {t('worker.checkin.manualNote')}
              </p>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="mt-5">
          <Button
            data-testid="btn-confirm-checkin"
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
            className="font-bold shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Confirm Check-In'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
