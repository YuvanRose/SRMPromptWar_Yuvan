import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Send,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getHazardReports, type HazardReport } from '@/lib/seed-data';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFeedback } from '@/components/FeedbackToast';

type FilterTab = 'open' | 'investigating' | 'resolved' | 'all';

export function HazardInbox() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { showSuccess } = useFeedback();

  const orgId = profile?.org_id || 'demo-org-const';
  const initialReports = useMemo(() => getHazardReports('', 'employer', orgId), [orgId]);

  const [reports, setReports] = useState<HazardReport[]>(initialReports);
  const [activeTab, setActiveTab] = useState<FilterTab>('open');
  const [expandedId, setExpandedId] = useState<string | null>(initialReports[0]?.id || null);

  // Per-report edit state
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [assignees, setAssignees] = useState<Record<string, string>>({});

  const supervisors = orgId.includes('metrobuild')
    ? ['Supervisor Vikram Patel', 'Safety Officer Ananya Sharma', 'Site Engineer Manoj']
    : ['Dr. Ramesh (HOD)', 'Prof. Kavitha (Lab In-charge)', 'Admin Officer David'];

  const handleStatusChange = (id: string, newStatus: HazardReport['currentStatus']) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updatedHistory = [
            ...r.statusHistory,
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              by: profile?.full_name || 'Employer',
              note: `Status updated to ${newStatus}`,
            },
          ];
          return { ...r, currentStatus: newStatus, statusHistory: updatedHistory };
        }
        return r;
      })
    );
    showSuccess(`Hazard status changed to ${newStatus}`);
  };

  const handleSendReply = (id: string) => {
    const text = replies[id]?.trim();
    if (!text) return;

    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updatedHistory = [
            ...r.statusHistory,
            {
              status: r.currentStatus,
              timestamp: new Date().toISOString(),
              by: profile?.full_name || 'Employer',
              note: text,
            },
          ];
          return { ...r, statusHistory: updatedHistory };
        }
        return r;
      })
    );

    setReplies((prev) => ({ ...prev, [id]: '' }));
    showSuccess('Reply sent to worker successfully');
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (activeTab === 'open' && (r.currentStatus === 'resolved' || r.currentStatus === 'closed'))
        return false;
      if (activeTab === 'investigating' && r.currentStatus !== 'investigating') return false;
      if (activeTab === 'resolved' && r.currentStatus !== 'resolved') return false;
      return true;
    });
  }, [reports, activeTab]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            {t('employer.hazards.title')}
          </h2>
          <p className="text-sm text-neutral-500">
            Review worker hazard reports, assign responsibilities, and reply with actions
          </p>
        </div>

        {/* Tab Filter Buttons */}
        <div className="flex items-center rounded-lg bg-neutral-200/80 p-1">
          {[
            { id: 'open', label: 'Open' },
            { id: 'investigating', label: 'In Progress' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FilterTab)}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-neutral-200">
            <ShieldCheck className="w-12 h-12 text-success-500 mx-auto mb-2" />
            <p className="text-neutral-700 font-bold">{t('employer.hazards.noOpen')}</p>
            <p className="text-xs text-neutral-400 mt-1">All reports in this category are addressed</p>
          </Card>
        ) : (
          filteredReports.map((report) => {
            const isExpanded = expandedId === report.id;
            return (
              <Card
                key={report.id}
                className="overflow-hidden border border-neutral-200 bg-white shadow-xs"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-neutral-50/60 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-neutral-900">{report.title}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-danger-100 text-danger-700 uppercase">
                          {report.severity}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Reported by <strong className="text-neutral-700">{report.reportedBy}</strong> •{' '}
                        {report.location} •{' '}
                        {new Date(report.reportedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                      {report.currentStatus}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Action Panel */}
                {isExpanded && (
                  <div className="border-t border-neutral-200 bg-neutral-50/50 p-5 space-y-5 animate-in fade-in">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                        Report Description
                      </h4>
                      <p className="text-sm text-neutral-800 bg-white p-3.5 rounded-lg border border-neutral-200 leading-relaxed">
                        {report.description}
                      </p>
                    </div>

                    {/* Action Controls: Assignee & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Assignee */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                          {t('employer.hazards.assign')}
                        </label>
                        <select
                          value={assignees[report.id] || supervisors[0]}
                          onChange={(e) =>
                            setAssignees((prev) => ({ ...prev, [report.id]: e.target.value }))
                          }
                          className="w-full text-sm font-medium text-neutral-800 bg-white border border-neutral-300 rounded-lg p-2.5 shadow-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        >
                          {supervisors.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Change Status */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                          {t('employer.hazards.changeStatus')}
                        </label>
                        <select
                          value={report.currentStatus}
                          onChange={(e) =>
                            handleStatusChange(
                              report.id,
                              e.target.value as HazardReport['currentStatus']
                            )
                          }
                          className="w-full text-sm font-medium text-neutral-800 bg-white border border-neutral-300 rounded-lg p-2.5 shadow-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        >
                          <option value="open">Open</option>
                          <option value="investigating">Investigating / In Progress</option>
                          <option value="resolved">Resolved / Fixed</option>
                          <option value="closed">Closed / Dismissed</option>
                        </select>
                      </div>
                    </div>

                    {/* Status History & Notes */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                        Audit Trail & Messages
                      </h4>
                      <div className="space-y-2">
                        {report.statusHistory.map((hist, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-white p-3 rounded-lg border border-neutral-200"
                          >
                            <div className="flex justify-between font-semibold text-neutral-700">
                              <span>By {hist.by}</span>
                              <span className="text-neutral-400 font-normal">
                                {new Date(hist.timestamp).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="mt-1 text-neutral-600">{hist.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reply to Worker */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                        {t('employer.hazards.reply', { worker: report.reportedBy })}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replies[report.id] || ''}
                          onChange={(e) =>
                            setReplies((prev) => ({ ...prev, [report.id]: e.target.value }))
                          }
                          placeholder={t('employer.hazards.replyPlaceholder')}
                          className="flex-1 text-sm bg-white border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => handleSendReply(report.id)}
                          className="text-xs font-bold shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{t('employer.hazards.sendReply')}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
export default HazardInbox;
