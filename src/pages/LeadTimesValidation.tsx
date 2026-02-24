import { useState, useCallback, useRef, useEffect } from 'react';
import { CheckSquare, Square, RefreshCw, Send, ChevronUp, ChevronDown, Anchor, Wind, Truck, Train } from 'lucide-react';
import { leadTimes, actualLeadTimesMap } from '../data/mockData';
import type { LeadTime, ActualLeadTime } from '../types';
import { Modal } from '../components/shared/Modal';
import { Badge } from '../components/shared/Badge';
import { useApp } from '../context/AppContext';

type TimePeriod = '1w' | '1m' | '3m';

const transportIcon: Record<string, React.ReactNode> = {
  boat:  <Anchor size={12} />,
  air:   <Wind size={12} />,
  truck: <Truck size={12} />,
  rail:  <Train size={12} />,
};

const transportLabel: Record<string, string> = {
  boat: 'Boat', air: 'Air', truck: 'Truck', rail: 'Rail',
};

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return <Badge variant="gray">0d</Badge>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border
      ${delta > 0
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-green-50 text-green-700 border-green-200'}`}
    >
      {delta > 0 ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      {delta > 0 ? '+' : ''}{delta}d
    </span>
  );
}

const BATCH = 20;

export function LeadTimesValidation() {
  const { appendMention } = useApp();
  const [items, setItems] = useState<LeadTime[]>(leadTimes);
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
      i.selected ? { ...i, plannedDays: i.aiSuggestedDays, selected: false } : i
    ));
    setConfirmModal(false);
  };

  const actuals: ActualLeadTime[] = selectedId ? (actualLeadTimesMap[selectedId] ?? []) : [];
  const selectedItem = items.find(i => i.id === selectedId);

  const periodLabels: Record<TimePeriod, string> = { '1w': '1 Week', '1m': '1 Month', '3m': '3 Months' };

  const handleRowClick = (e: React.MouseEvent, item: LeadTime) => {
    if (e.shiftKey) {
      const from = item.fromLocation.replace(/ /g, '_');
      const to = item.toLocation.replace(/ /g, '_');
      appendMention(`@LT:${from}-${to}`);
      return;
    }
    setSelectedId(item.id === selectedId ? null : item.id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Times Validation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Compare planning system lead times against actual observed shipment data.
            {' '}<span className="font-medium text-amber-600">{items.filter(i => i.totalDeviation > 30).length} lanes</span> deviate &gt;30% accumulated.
            {' '}Shift+click a row to mention in chat.
          </p>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Deviation window selector */}
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
        {/* Left Panel — Planning System Lead Times */}
        <div className="card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Planning System Lead Times</h2>
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
            style={{ gridTemplateColumns: '24px 1fr 1fr 52px 46px 56px 62px 68px' }}
          >
            <span />
            <span>From</span>
            <span>To</span>
            <span>Mode</span>
            <span className="text-right">Plan</span>
            <span className="text-right">AI Sug.</span>
            <span className="text-right">Avg Dev.</span>
            <span className="text-right">Acc. Dev.</span>
          </div>

          {/* Infinite-scroll rows */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {visibleItems.map(item => {
              const isActive = selectedId === item.id;
              const devOver30 = item.totalDeviation > 30;
              return (
                <div
                  key={item.id}
                  onClick={e => handleRowClick(e, item)}
                  title="Shift+click to mention in chat"
                  className={`grid items-center px-3 py-2.5 cursor-pointer border-b border-gray-50 transition-colors text-xs list-row
                    ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  style={{ gridTemplateColumns: '24px 1fr 1fr 52px 46px 56px 62px 68px' }}
                >
                  <span
                    onClick={e => toggleSelect(item.id, e)}
                    className={`cursor-pointer ${item.selected ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}
                  >
                    {item.selected ? <CheckSquare size={14} /> : <Square size={14} />}
                  </span>
                  <span className="font-medium text-gray-800 truncate pr-1">{item.fromLocation}</span>
                  <span className="text-gray-600 truncate pr-1">{item.toLocation}</span>
                  <span className="flex items-center gap-1 text-gray-500">
                    {transportIcon[item.transport]}
                    <span className="truncate">{transportLabel[item.transport]}</span>
                  </span>
                  <span className="text-right font-medium text-gray-800">{item.plannedDays}d</span>
                  <span className={`text-right font-semibold ${item.aiSuggestedDays !== item.plannedDays ? 'text-amber-600' : 'text-gray-400'}`}>
                    {item.aiSuggestedDays}d
                  </span>
                  <span className="text-right text-gray-600">
                    {item.avgDeviation.toFixed(1)}d
                  </span>
                  <span className={`text-right font-bold ${devOver30 ? 'text-red-600' : 'text-amber-500'}`}>
                    {item.totalDeviation.toFixed(1)}%
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

        {/* Right Panel — Actual Lead Times */}
        <div className="card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-800">
              {selectedItem ? `Actual Shipments: ${selectedItem.fromLocation} → ${selectedItem.toLocation}` : 'Actual Shipment Data'}
            </h2>
            <p className="text-xs text-gray-500">
              {selectedItem
                ? `${transportLabel[selectedItem.transport]} · Planned: ${selectedItem.plannedDays}d · AI suggested: ${selectedItem.aiSuggestedDays}d · Window: ${periodLabels[timePeriod]}`
                : 'Select a lane on the left to view actual shipment data'}
            </p>
          </div>

          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Truck size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click a lane on the left panel to view actual shipment history</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              {selectedItem && (
                <div className="grid grid-cols-3 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {actuals.length > 0 ? (actuals.reduce((s, a) => s + a.actualDays, 0) / actuals.length).toFixed(1) : '—'}d
                    </div>
                    <div className="text-xs text-gray-500">Avg Actual</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      (actuals.reduce((s, a) => s + a.deltaVsPlanned, 0) / Math.max(1, actuals.length)) > 0
                        ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {actuals.length > 0
                        ? `${(actuals.reduce((s, a) => s + a.deltaVsPlanned, 0) / actuals.length) > 0 ? '+' : ''}${(actuals.reduce((s, a) => s + a.deltaVsPlanned, 0) / actuals.length).toFixed(1)}d`
                        : '—'}
                    </div>
                    <div className="text-xs text-gray-500">Avg Delta</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{actuals.length}</div>
                    <div className="text-xs text-gray-500">Shipments</div>
                  </div>
                </div>
              )}

              {/* Table header */}
              <div className="grid text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 px-3 py-2 flex-shrink-0"
                style={{ gridTemplateColumns: '1fr 1fr 1fr 70px 80px' }}>
                <span>Ref</span>
                <span>Pickup</span>
                <span>Drop-off</span>
                <span className="text-right">Actual</span>
                <span className="text-right">vs. Plan</span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {actuals.map(a => (
                  <div
                    key={a.id}
                    className="grid items-center px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors text-xs"
                    style={{ gridTemplateColumns: '1fr 1fr 1fr 70px 80px' }}
                  >
                    <span className="font-mono text-gray-600">{a.shipmentRef}</span>
                    <span className="text-gray-700">{a.pickupDate}</span>
                    <span className="text-gray-700">{a.dropoffDate}</span>
                    <span className="text-right font-medium text-gray-800">{a.actualDays}d</span>
                    <span className="text-right"><DeltaBadge delta={a.deltaVsPlanned} /></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal open={confirmModal} onClose={() => setConfirmModal(false)} title="Submit Lead Time Updates via MCP">
        <div className="text-sm text-gray-600 mb-4">
          The following AI-suggested lead times will be submitted to Blue Yonder APO via MCP:
        </div>
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">Lane</th>
                <th className="px-3 py-2 text-right text-gray-500 font-semibold">Current</th>
                <th className="px-3 py-2 text-right text-gray-500 font-semibold">New</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map(item => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-700">{item.fromLocation} → {item.toLocation} ({transportLabel[item.transport]})</td>
                  <td className="px-3 py-2 text-right text-gray-600">{item.plannedDays}d</td>
                  <td className="px-3 py-2 text-right font-semibold text-green-700">{item.aiSuggestedDays}d</td>
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
