import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getHazardReports, type HazardReport } from '@/lib/seed-data';
import { Card } from '@/components/ui/Card';

export function MyReports() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const orgId = profile?.org_id || 'demo-org-const';
  const workerId = profile?.id || 'demo-wc-001';

  const reports: HazardReport[] = useMemo(() => {
    return getHazardReports(workerId, 'worker', orgId);
  }, [workerId, orgId]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'fixed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-success-50 text-success-700 border border-success-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('worker.reports.status.fixed', 'Fixed')}</span>
          </span>
        );
      case 'investigating':
      case 'in_review':
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>{t('worker.reports.status.in_review', 'In Review')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>{t('worker.reports.status.received', 'Received')}</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">{t('worker.reports.title')}</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          {reports.length} report(s) submitted
        </p>
      </div>

      {reports.length === 0 ? (
        <Card className="p-8 text-center bg-white border border-neutral-200">
          <ShieldAlert className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
          <p className="text-neutral-500 text-sm font-medium">{t('worker.reports.empty')}</p>
        </Card>
      ) : (
        reports.map((report) => {
          const isExpanded = expandedId === report.id;
          return (
            <Card
              key={report.id}
              className="border border-neutral-200 bg-white shadow-sm overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleExpand(report.id)}
                className="w-full text-left p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-expanded={isExpanded}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-warning-100 text-warning-700">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 leading-tight">
                        {report.title || report.type}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {new Date(report.reportedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(report.currentStatus)}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                </div>

                <p className="mt-2 text-xs text-neutral-600 line-clamp-2">
                  {report.description}
                </p>
              </button>

              {/* Expandable Timeline & Employer Reply */}
              {isExpanded && (
                <div className="border-t border-neutral-100 bg-neutral-50/60 p-4 animate-in fade-in">
                  <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3">
                    Status Timeline & Responses
                  </h4>

                  <div className="relative border-l-2 border-primary-300 ml-3 space-y-4 py-1">
                    {report.statusHistory.map((item, idx) => (
                      <div key={idx} className="relative pl-6">
                        {/* Dot indicator */}
                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-primary-600 shadow-sm" />

                        <div className="flex flex-col">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-900 capitalize">
                              {item.status.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              {new Date(item.timestamp).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-neutral-500">
                            By {item.by}
                          </span>

                          {/* Employer Reply Bubble */}
                          {item.note && (
                            <div className="mt-2 rounded-lg bg-white p-3 border border-neutral-200 shadow-xs">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 mb-1">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{t('worker.reports.employerReply')}:</span>
                              </div>
                              <p className="text-xs text-neutral-700 leading-relaxed">
                                {item.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
export default MyReports;
