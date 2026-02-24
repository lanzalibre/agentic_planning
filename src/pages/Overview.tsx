import { Settings2, RefreshCw, ChevronRight, AlertTriangle, Clock, Package } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KPIWidget } from '../components/overview/KPIWidget';
import { KPIConfigModal } from '../components/overview/KPIConfigModal';

const recentActivity = [
  { id: 1, time: '02:00 AM', event: 'Planning run completed', detail: '142 exceptions generated', type: 'exception' },
  { id: 2, time: '01:45 AM', event: 'Lead time update applied', detail: 'MFG Mexico → DC Louisiana: 5d → 7d', type: 'config' },
  { id: 3, time: '12:30 AM', event: 'Throughput alert', detail: 'Assembly Line A1 below 80% capacity', type: 'alert' },
  { id: 4, time: 'Yesterday', event: 'Self-healing action executed', detail: 'DC Nebraska → DC Louisiana transfer created ($18.4k)', type: 'action' },
  { id: 5, time: 'Yesterday', event: 'Customer notification sent', detail: '47 orders: revised delivery 03/28/2026', type: 'action' },
];

const typeIcon: Record<string, React.ReactNode> = {
  exception: <AlertTriangle size={14} className="text-red-500" />,
  config:    <Settings2 size={14} className="text-blue-500" />,
  alert:     <Clock size={14} className="text-amber-500" />,
  action:    <Package size={14} className="text-green-500" />,
};

export function Overview() {
  const { kpiWidgets, setKpiWidgets, setCurrentPage } = useApp();
  const [configOpen, setConfigOpen] = useState(false);
  const visibleWidgets = kpiWidgets.filter(w => w.visible);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supply Chain Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last planning run: <span className="font-medium text-gray-700">Feb 24, 2026 — 02:00 AM</span>
            <span className="ml-2 inline-flex items-center gap-1 text-green-600 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Completed
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button onClick={() => setConfigOpen(true)} className="btn-secondary flex items-center gap-2">
            <Settings2 size={14} />
            Configure KPIs
          </button>
        </div>
      </div>

      {/* KPI Widgets */}
      {visibleWidgets.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 mb-6">
          <p className="text-sm">No KPI widgets configured. Click "Configure KPIs" to add some.</p>
        </div>
      ) : (
        <div className={`grid gap-4 mb-6 ${
          visibleWidgets.length === 1 ? 'grid-cols-1 max-w-xs' :
          visibleWidgets.length === 2 ? 'grid-cols-2 max-w-xl' :
          'grid-cols-3'
        }`}>
          {visibleWidgets.map(w => <KPIWidget key={w.id} widget={w} />)}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Evaluate Latest Planning Run', sub: '142 open exceptions', page: 'exception-analysis' as const, color: 'red' },
          { label: 'Review Lead Time Deviations', sub: '23 lanes above 30% threshold', page: 'lead-times' as const, color: 'amber' },
          { label: 'Review Throughput Issues', sub: '17 resources below threshold', page: 'throughput' as const, color: 'blue' },
        ].map(action => (
          <button
            key={action.page}
            onClick={() => setCurrentPage(action.page)}
            className="card p-4 text-left hover:shadow-md transition-all hover:border-blue-200 group"
          >
            <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{action.label}</div>
            <div className="text-xs text-gray-500 mt-1">{action.sub}</div>
            <div className="flex items-center gap-1 text-xs font-medium text-blue-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Open <ChevronRight size={12} />
            </div>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentActivity.map(item => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-shrink-0 w-5 flex items-center justify-center">
                {typeIcon[item.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">{item.event}</div>
                <div className="text-xs text-gray-500">{item.detail}</div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">{item.time}</div>
            </div>
          ))}
        </div>
      </div>

      <KPIConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        widgets={kpiWidgets}
        onChange={setKpiWidgets}
      />
    </div>
  );
}
