import { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useSector } from '@/lib/sector';
import { Card } from '@/components/ui/Card';

interface WorkerItem {
  id: string;
  name: string;
  role: string;
  site: string;
  phone: string;
  lastCheckIn: string;
  status: 'active' | 'inactive';
  totalHoursMonth: number;
  otHoursMonth: number;
  hazardsReported: number;
}

export function WorkersView() {
  const { profile } = useAuth();
  const sector = useSector();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isConstruction = profile?.org_id.includes('metrobuild');

  const workersList: WorkerItem[] = useMemo(() => {
    if (isConstruction) {
      return [
        {
          id: 'w-1',
          name: 'Rajesh Kumar',
          role: 'Mason Foreman',
          site: 'Site Alpha',
          phone: '+91 98765 43210',
          lastCheckIn: 'Today, 07:54 AM',
          status: 'active',
          totalHoursMonth: 214,
          otHoursMonth: 38,
          hazardsReported: 3,
        },
        {
          id: 'w-2',
          name: 'Mohammed Farooq',
          role: 'Crane Operator',
          site: 'Site Alpha',
          phone: '+91 98765 43211',
          lastCheckIn: 'Today, 07:45 AM',
          status: 'active',
          totalHoursMonth: 198,
          otHoursMonth: 26,
          hazardsReported: 1,
        },
        {
          id: 'w-3',
          name: 'Sunil Yadav',
          role: 'Bar Bender',
          site: 'Site Alpha',
          phone: '+91 98765 43212',
          lastCheckIn: 'Today, 08:22 AM',
          status: 'active',
          totalHoursMonth: 180,
          otHoursMonth: 12,
          hazardsReported: 0,
        },
        {
          id: 'w-4',
          name: 'Deepak Paswan',
          role: 'Scaffolder',
          site: 'Site Alpha',
          phone: '+91 98765 43213',
          lastCheckIn: 'Today, 08:00 AM',
          status: 'active',
          totalHoursMonth: 192,
          otHoursMonth: 18,
          hazardsReported: 2,
        },
        {
          id: 'w-5',
          name: 'Lakshmi Devi',
          role: 'Safety Helper',
          site: 'Site Alpha',
          phone: '+91 98765 43214',
          lastCheckIn: 'Yesterday, 05:00 PM',
          status: 'inactive',
          totalHoursMonth: 140,
          otHoursMonth: 0,
          hazardsReported: 1,
        },
      ];
    } else {
      return [
        {
          id: 's-1',
          name: 'Priya Venkatesh',
          role: 'Assistant Professor',
          site: 'CS Department',
          phone: '+91 94440 12345',
          lastCheckIn: 'Today, 08:50 AM',
          status: 'active',
          totalHoursMonth: 168,
          otHoursMonth: 14,
          hazardsReported: 2,
        },
        {
          id: 's-2',
          name: 'Arjun Nair',
          role: 'Lab Instructor',
          site: 'CS Department',
          phone: '+91 94440 12346',
          lastCheckIn: 'Today, 09:12 AM',
          status: 'active',
          totalHoursMonth: 160,
          otHoursMonth: 8,
          hazardsReported: 1,
        },
        {
          id: 's-3',
          name: 'Meenakshi Sundaram',
          role: 'Department Assistant',
          site: 'CS Department',
          phone: '+91 94440 12347',
          lastCheckIn: 'Today, 08:45 AM',
          status: 'active',
          totalHoursMonth: 162,
          otHoursMonth: 6,
          hazardsReported: 0,
        },
        {
          id: 's-4',
          name: 'Karthik Raja',
          role: 'Network Technician',
          site: 'CS Department',
          phone: '+91 94440 12348',
          lastCheckIn: '3 days ago',
          status: 'inactive',
          totalHoursMonth: 110,
          otHoursMonth: 0,
          hazardsReported: 0,
        },
      ];
    }
  }, [isConstruction]);

  const filteredWorkers = useMemo(() => {
    return workersList.filter(
      (w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.site.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workersList, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Title & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            {sector.workerPluralLabel} Directory
          </h2>
          <p className="text-sm text-neutral-500">
            {profile?.org_name} workforce roster and active credentials
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${sector.workerPluralLabel.toLowerCase()}...`}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-300 rounded-lg shadow-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Workers Table */}
      <Card className="overflow-hidden border border-neutral-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-bold text-neutral-600 uppercase tracking-wider">
                <th className="py-3 px-4">{sector.workerLabel}</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">{sector.siteLabel}</th>
                <th className="py-3 px-4">Last Check-in</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredWorkers.map((worker) => {
                const isExpanded = expandedId === worker.id;
                return (
                  <tr
                    key={worker.id}
                    onClick={() => setExpandedId(isExpanded ? null : worker.id)}
                    className="hover:bg-neutral-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-semibold text-neutral-900">
                      <div>{worker.name}</div>
                      <div className="text-xs text-neutral-400 font-normal flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{worker.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-700">{worker.role}</td>
                    <td className="py-3.5 px-4 text-neutral-600">{worker.site}</td>
                    <td className="py-3.5 px-4 text-neutral-600">{worker.lastCheckIn}</td>
                    <td className="py-3.5 px-4">
                      {worker.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-50 text-success-700">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        className="text-neutral-400 hover:text-primary-600 p-1 rounded"
                        aria-label="Expand worker details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expanded Quick Summary Banner */}
      {expandedId && (
        <div className="p-4 rounded-xl bg-primary-50 border border-primary-200 animate-in fade-in flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="font-bold text-sm text-primary-900">
              {workersList.find((w) => w.id === expandedId)?.name}
            </h4>
            <p className="text-xs text-primary-700">Monthly Performance & Safety Metrics</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Total Hours</span>
              <p className="font-bold text-base text-neutral-900">
                {workersList.find((w) => w.id === expandedId)?.totalHoursMonth}h
              </p>
            </div>
            <div className="text-center">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Overtime</span>
              <p className="font-bold text-base text-amber-700">
                +{workersList.find((w) => w.id === expandedId)?.otHoursMonth}h
              </p>
            </div>
            <div className="text-center">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Hazards</span>
              <p className="font-bold text-base text-primary-700">
                {workersList.find((w) => w.id === expandedId)?.hazardsReported}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default WorkersView;
