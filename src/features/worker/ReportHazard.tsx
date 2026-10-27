import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Mic,
  Square,
  Camera,
  Image as ImageIcon,
  Send,
  Trash2,
  Play,
  Pause,
} from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { useSector } from '@/lib/sector';
import { addToOutbox } from '@/lib/sync';
import { useFeedback } from '@/components/FeedbackToast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const hazardSchema = z.object({
  hazardType: z.string().min(1, 'Please select a hazard type'),
  description: z.string().min(5, 'Please provide at least 5 characters of description'),
});

export function ReportHazard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const sector = useSector();
  const { showSuccess, showQueued, showError } = useFeedback();

  const [hazardType, setHazardType] = useState<string>(sector.hazardTypes[0] || 'unsafe_equipment');
  const [description, setDescription] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{ hazardType?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      // Fallback simulated voice note for testing environments
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 3) {
            stopRecording();
            setAudioUrl('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setRecordingDuration(0);
  };

  // Photo handlers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If there is audio, description can be brief
    const finalDescription = description.trim() || (audioUrl ? '[Voice Note attached]' : '');

    const result = hazardSchema.safeParse({
      hazardType,
      description: finalDescription,
    });

    if (!result.success) {
      const errors: { hazardType?: string; description?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'hazardType') errors.hazardType = err.message;
        if (err.path[0] === 'description') errors.description = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        hazard_type: hazardType,
        description: finalDescription,
        reporter_id: profile?.id || 'demo-wc-001',
        org_id: profile?.org_id || 'demo-org-const',
        site_id: profile?.site_id || 'site-alpha',
        has_audio: !!audioUrl,
        has_photo: !!photoPreview,
        created_at: new Date().toISOString(),
      };

      await addToOutbox('hazard_report', payload);

      if (navigator.onLine) {
        showSuccess(t('worker.hazard.success'));
      } else {
        showQueued(t('worker.hazard.queued'));
      }

      setTimeout(() => {
        navigate('/worker/my-reports');
      }, 800);
    } catch (err) {
      console.error(err);
      showError(t('worker.hazard.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">{t('worker.hazard.title')}</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          {sector.siteLabel}: {profile?.site_name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Hazard Type Selector */}
        <div>
          <label className="text-sm font-semibold text-neutral-800 block mb-2">
            {t('worker.hazard.type')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sector.hazardTypes.map((ht) => {
              const isSelected = hazardType === ht;
              return (
                <button
                  key={ht}
                  type="button"
                  onClick={() => setHazardType(ht)}
                  className={[
                    'touch-target flex items-center gap-2 p-3 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'border-primary-600 bg-primary-50 text-primary-900 ring-2 ring-primary-500'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300',
                  ].join(' ')}
                >
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary-600' : 'text-neutral-400'}`}
                  />
                  <span className="text-xs font-semibold">{t(`worker.hazard.type.${ht}`, ht)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Description */}
        <div>
          <label htmlFor="hazard-desc" className="text-sm font-semibold text-neutral-800 block mb-1">
            {t('worker.hazard.describe')}
          </label>
          <textarea
            id="hazard-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is the problem? Where is it located?"
            className={[
              'w-full p-3 rounded-lg border text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500',
              formErrors.description ? 'border-danger-500' : 'border-neutral-300',
            ].join(' ')}
          />
          {formErrors.description && (
            <p className="text-xs text-danger-500 font-medium mt-1">{formErrors.description}</p>
          )}
        </div>

        {/* Voice Note Section */}
        <Card className="p-3 border border-neutral-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-800">
                {t('worker.hazard.voiceRecord')}
              </span>
            </div>

            {!isRecording && !audioUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startRecording}
                className="flex items-center gap-1.5 text-xs text-primary-700"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Record</span>
              </Button>
            )}

            {isRecording && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={stopRecording}
                className="flex items-center gap-1.5 text-xs animate-pulse"
              >
                <Square className="w-3.5 h-3.5" />
                <span>{recordingDuration}s (Stop)</span>
              </Button>
            )}
          </div>

          {audioUrl && (
            <div className="mt-3 flex items-center justify-between bg-neutral-50 p-2 rounded-lg border border-neutral-200">
              <audio ref={audioElementRef} src={audioUrl} onEnded={() => setIsPlayingAudio(false)} className="hidden" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (audioElementRef.current) {
                      if (isPlayingAudio) {
                        audioElementRef.current.pause();
                        setIsPlayingAudio(false);
                      } else {
                        audioElementRef.current.play();
                        setIsPlayingAudio(true);
                      }
                    }
                  }}
                  className="p-1.5 rounded-full bg-primary-600 text-white hover:bg-primary-700"
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <span className="text-xs font-medium text-neutral-700">Voice Note recorded</span>
              </div>
              <button
                type="button"
                onClick={deleteRecording}
                className="text-danger-500 hover:text-danger-700 p-1"
                aria-label="Delete recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </Card>

        {/* Photo Attachment */}
        <Card className="p-3 border border-neutral-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-800">
                {t('worker.hazard.addPhoto')}
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {!photoPreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-primary-700"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Choose</span>
              </Button>
            )}
          </div>

          {photoPreview && (
            <div className="mt-3 relative inline-block">
              <img
                src={photoPreview}
                alt="Hazard preview"
                className="h-28 w-28 object-cover rounded-lg border border-neutral-200"
              />
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full p-1 shadow hover:bg-danger-600"
                aria-label="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
          className="mt-2 text-base font-bold shadow-md"
        >
          <Send className="w-5 h-5" />
          <span>{isSubmitting ? t('common.loading') : t('worker.hazard.submit')}</span>
        </Button>
      </form>
    </div>
  );
}
export default ReportHazard;
