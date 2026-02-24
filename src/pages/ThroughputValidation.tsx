import { useState, useCallback, useRef, useEffect } from 'react';
import { CheckSquare, Square, RefreshCw, Send, Factory, AlertCircle } from 'lucide-react';
import { resources, actualThroughputsMap, NON_ISSUE_OBSERVATIONS } from '../data/mockData';
import type { Resource, ActualThroughput } from '../types';
import { Modal } from '../components/shared/Modal';
import { useApp } from '../context/AppContext';

type TimePeriod = '1w' | '1m' | '3m';

const BATCH = 20;

export function ThroughputValidation() {
  const { appendMention } = useApp();
  const [items, setItems] = useState<Resource[]>(resources);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1m');
  const [confirmModal, setConfirmModal] = useState(false);
  const [visibleCount, setVisibleCount] = useState(BATCH);

  // Infinite scroll refs
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = listRef.current;
    if (!sentinel || !container) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisibleCount(prev => Math.min(prev + BATCH, items.length));
      },
      { root: container, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length, visibleCount]);

  const visibleItems = items.slice(0, visibleCount);
  const selectedItems = items.filter(i => i.selected);

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  }, []);

  const toggleSelectAll = () => {
    const allSelected = visibleItems.every(i => i.selected);
    const visibleIds = new Set(visibleItems.map(i => i.id));
    setItems(prev => prev.map(i => visibleIds.has(i.id) ? { ...i, selected: !allSelected } : i));
  };

  const handleConfirm = () => {
    setItems(prev => prev.map(i =>
      i.selected ? { ...i, plannedThroughput: i.aiSuggestedThroughput, selected: false } : i
    ));
    setConfirmModal(false);
  };

  const actuals: ActualThroughput[] = selectedId ? (actualThroughputsMap[selectedId] ?? []) : [];
  const selectedItem = items.find(i => i.id === selectedId);

  const handleRowClick = (e: React.MouseEvent, item: Resource) => {
    if (e.shiftKey) {
      appendMention(`@Resource:${item.name.replace(/ /g, '_')}`);
      return;
    }
    setSelectedId(item.id === selectedId ? null : item.id);
  };

  const isAllNonIssue = (obs: string[]) =>
    obs.length > 0 && obs.every(o => NON_ISSUE_OBSERVATIONS.has(o));

  // Right panel summary stats
  const totalPlannedUptime = selectedItem ? selectedItem.plannedUptimeHours * actuals.length : 0;
  const totalActualUptime = actuals.reduce((s, a) => s + a.uptimeHours, 0);
  const totalThroughputUnits = actuals.reduce((s, a) => s + a.throughput * a.uptimeHours, 0);
  const avgActualThroughput = actuals.length > 0
    ? actuals.reduce((s, a) => s + a.throughput, 0) / actuals.length
    : 0;
  const pctDeviation = selectedItem && selectedItem.plannedThroughput > 0
    ? ((avgActualThroughput - selectedItem.plannedThroughput) / selectedItem.plannedThroughput * 100)
    : 0;

  const periodLabels: Record<TimePeriod, string> = { '1w': '1 Week', '1m': '1 Month', '3m': '3 Months' };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Throughput Validation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Compare planning system resource throughputs against actual observed MES data.
            {' '}<span className="font-medium text-blue-600">{items.filter(i => i.totalDeviation > 30).length} resources</span> deviate &gt;30%.
            {' '}Shift+click a row to mention in chat.
          </p>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Deviation window selector — mirrors Lead Times Validation */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-gray-500 font-medium">Deviation window:</span>
        <div className="flex gap-1">
          {(['1w', '1m', '3m'] as TimePeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setTimePeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                ${timePeriod === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4" style={{ height: 'calc(100vh - 300px)', minHeight: 400 }}>
        {/* Left Panel — Planning System Resources */}
        <div className="card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Planning System Resources</h2>
              <p className="text-xs text-gray-500">Blue Yonder APO · Sorted by accumulated deviation ↓</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedItems.length > 0 && (
                <button
                  onClick={() => setConfirmModal(true)}
                  className="text-xs text-green-700 hover:text-green-800 font-semibold flex items-center gap-1"
                >
                  <Send size={11} />
                  Submit {selectedItems.length} via MCP
                </button>
              )}
              <button
                onClick={toggleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {visibleItems.every(i => i.selected) ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          </div>

          {/* Column header */}
          <div
            className="grid text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 px-3 py-2 flex-shrink-0"
            style={{ gridTemplateColumns: '24px 1fr 90px 52px 60px 72px' }}
          >
            <span />
            <span>Resource</span>
            <span>Location</span>
            <span className="text-right">Plan</span>
            <span className="text-right">AI Sug.</span>
            <span className="text-right">Dev.</span>
          </div>

          {/* Infinite-scroll rows */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {visibleItems.map(item => {
              const isActive = selectedId === item.id;
              const devOver30 = item.totalDeviation > 30;
              const pctDiff = item.plannedThroughput > 0
                ? ((item.aiSuggestedThroughput - item.plannedThroughput) / item.plannedThroughput * 100)
                : 0;
              return (
                <div
                  key={item.id}
                  onClick={e => handleRowClick(e, item)}
                  title="Shift+click to mention in chat"
                  className={`grid items-center px-3 py-2.5 cursor-pointer border-b border-gray-50 transition-colors text-xs list-row
                    ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  style={{ gridTemplateColumns: '24px 1fr 90px 52px 60px 72px' }}
                >
                  <span
                    onClick={e => toggleSelect(item.id, e)}
                    className={`cursor-pointer ${item.selected ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}
                  >
                    {item.selected ? <CheckSquare size={14} /> : <Square size={14} />}
                  </span>
                  <span className="font-medium text-gray-800 truncate pr-1">{item.name}</span>
                  <span className="text-gray-500 text-xs truncate">{item.location}</span>
                  <span className="text-right font-medium text-gray-800">{item.plannedThroughput}</span>
                  <span className={`text-right font-semibold ${item.aiSuggestedThroughput !== item.plannedThroughput ? 'text-amber-600' : 'text-gray-400'}`}>
                    {item.aiSuggestedThroughput}
                  </span>
                  <span className={`text-right font-bold ${devOver30 ? 'text-red-600' : 'text-amber-500'}`}>
                    {pctDiff.toFixed(0)}%
                  </span>
                </div>
              );
            })}
            {/* Infinite scroll sentinel */}
            {visibleCount < items.length && (
              <div ref={sentinelRef} className="h-8 flex items-center justify-center text-xs text-gray-400">
                Loading…
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Actual Throughputs */}
        <div className="card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-800">
              {selectedItem ? `MES Data: ${selectedItem.name}` : 'MES Observations'}
            </h2>
            <p className="text-xs text-gray-500">
              {selectedItem
                ? `${selectedItem.location} · Planned: ${selectedItem.plannedThroughput} u/h · AI suggested: ${selectedItem.aiSuggestedThroughput} u/h · Window: ${periodLabels[timePeriod]}`
                : 'Select a resource on the left to view MES throughput data'}
            </p>
          </div>

          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Factory size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click a resource on the left panel to view MES throughput history</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary: Planned Uptime | Actual Uptime | Throughput Total | % Deviation */}
              {selectedItem && (
                <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-base font-bold text-gray-900">{totalPlannedUptime.toFixed(0)}h</div>
                    <div className="text-xs text-gray-500">Planned Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-base font-bold ${totalActualUptime < totalPlannedUptime ? 'text-red-600' : 'text-green-700'}`}>
                      {totalActualUptime.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-500">Actual Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-gray-900">
                      {Math.round(totalThroughputUnits).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Throughput Total</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-base font-bold ${pctDeviation < -20 ? 'text-red-600' : pctDeviation < 0 ? 'text-amber-600' : 'text-green-700'}`}>
                      {pctDeviation > 0 ? '+' : ''}{pctDeviation.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">% Deviation</div>
                  </div>
                </div>
              )}

              {/* Table header */}
              <div
                className="grid text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 px-3 py-2 flex-shrink-0"
                style={{ gridTemplateColumns: '80px 68px 68px 72px 72px 52px 1fr' }}
              >
                <span>Date</span>
                <span className="text-right">Pln. Uptime</span>
                <span className="text-right">Act. Uptime</span>
                <span className="text-right">Units</span>
                <span className="text-right">u/h</span>
                <span className="text-right">Δ%</span>
                <span className="pl-3">MES Observations</span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {actuals.map(a => {
                  const pct = selectedItem
                    ? ((a.throughput - selectedItem.plannedThroughput) / selectedItem.plannedThroughput * 100)
                    : 0;
                  const totalUnits = Math.round(a.throughput * a.uptimeHours);
                  const nonIssue = isAllNonIssue(a.observations);

                  return (
                    <div
                      key={a.id}
                      className="grid items-start px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors text-xs"
                      style={{ gridTemplateColumns: '80px 68px 68px 72px 72px 52px 1fr' }}
                    >
                      <span className="font-medium text-gray-700 pt-0.5">{a.date}</span>
                      <span className="text-right text-gray-500 pt-0.5">{selectedItem?.plannedUptimeHours ?? '—'}h</span>
                      <span className={`text-right pt-0.5 ${a.uptimeHours < (selectedItem?.plannedUptimeHours ?? 8) ? 'text-amber-600' : 'text-gray-700'}`}>
                        {a.uptimeHours}h
                      </span>
                      <span className="text-right font-medium text-gray-800 pt-0.5">
                        {totalUnits.toLocaleString()}
                      </span>
                      <div className="text-right pt-0.5">
                        <span className={`font-semibold ${pct < -20 ? 'text-red-600' : pct < 0 ? 'text-amber-600' : 'text-green-700'}`}>
                          {a.throughput}
                        </span>
                      </div>
                      <span className={`text-right pt-0.5 font-medium ${pct < -20 ? 'text-red-600' : pct < 0 ? 'text-amber-500' : 'text-green-600'}`}>
                        {pct > 0 ? '+' : ''}{pct.toFixed(0)}%
                      </span>
                      <div className="pl-3 pt-0.5">
                        {nonIssue ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {a.observations.map((obs, oi) => (
                              <span key={oi} className="flex items-start gap-1 text-gray-500 leading-relaxed">
                                <AlertCircle size={10} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                {obs}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal open={confirmModal} onClose={() => setConfirmModal(false)} title="Submit Throughput Updates via MCP">
        <div className="text-sm text-gray-600 mb-4">
          The following AI-suggested throughputs will be submitted to Blue Yonder APO via MCP:
        </div>
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">Resource</th>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">Location</th>
                <th className="px-3 py-2 text-right text-gray-500 font-semibold">Current (u/h)</th>
                <th className="px-3 py-2 text-right text-gray-500 font-semibold">New (u/h)</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map(item => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-700">{item.name}</td>
                  <td className="px-3 py-2 text-gray-500">{item.location}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{item.plannedThroughput}</td>
                  <td className="px-3 py-2 text-right font-semibold text-green-700">{item.aiSuggestedThroughput}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setConfirmModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleConfirm} className="btn-success flex items-center gap-2">
            <Send size={14} />
            Confirm & Submit to Planning System
          </button>
        </div>
      </Modal>
    </div>
  );
}
