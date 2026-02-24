import { useState } from 'react';
import { CheckCircle, RefreshCw, GitBranch, MessageSquare, DollarSign, ChevronsUpDown, Maximize2, Minimize2, AlertTriangle, Wifi } from 'lucide-react';
import { exceptionGroups, selfHealingRules } from '../data/mockData';
import type { ExceptionGroup, PlanningException } from '../types';
import { FishboneDiagram } from '../components/planning/FishboneDiagram';
import { Modal } from '../components/shared/Modal';
import { Badge } from '../components/shared/Badge';
import { InfiniteListGrid } from '../components/shared/InfiniteListGrid';
import type { GridColumn } from '../components/shared/InfiniteListGrid';
import { useApp } from '../context/AppContext';

type ExpandState = 'compact' | 'medium' | 'full';

const channelVariant: Record<string, 'blue' | 'green' | 'purple'> = {
  online: 'blue', 'in-store': 'green', wholesale: 'purple',
};

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1_000).toFixed(0)}K`;

const exceptionColumns: GridColumn<PlanningException>[] = [
  {
    key: 'productHierarchy',
    label: 'Product Hierarchy',
    render: exc => <span className="font-mono text-gray-700">{exc.productHierarchy}</span>,
    csvValue: exc => exc.productHierarchy,
  },
  {
    key: 'channel',
    label: 'Channel',
    render: exc => <Badge variant={channelVariant[exc.channel]}>{exc.channel}</Badge>,
    csvValue: exc => exc.channel,
  },
  {
    key: 'sku',
    label: 'SKU',
    render: exc => <span className="font-mono text-gray-500">{exc.sku}</span>,
    csvValue: exc => exc.sku,
  },
  {
    key: 'periodFrom',
    label: 'From',
    render: exc => exc.periodFrom,
    csvValue: exc => exc.periodFrom,
    cellClass: 'text-gray-600',
  },
  {
    key: 'periodTo',
    label: 'To',
    render: exc => exc.periodTo,
    csvValue: exc => exc.periodTo,
    cellClass: 'text-gray-600',
  },
  {
    key: 'quantity',
    label: 'Qty',
    render: exc => exc.quantity.toLocaleString(),
    csvValue: exc => String(exc.quantity),
    headerClass: 'text-right',
    cellClass: 'text-right font-medium text-gray-800',
  },
  {
    key: 'monetaryValue',
    label: 'Value',
    render: exc => fmt(exc.monetaryValue),
    csvValue: exc => String(exc.monetaryValue),
    headerClass: 'text-right',
    cellClass: 'text-right font-medium text-gray-800',
  },
];

function GroupCard({
  group,
  expandState,
  onCycleExpand,
  onAccept,
  onRegroup,
  onExplain,
}: {
  group: ExceptionGroup;
  expandState: ExpandState;
  onCycleExpand: () => void;
  onAccept: (g: ExceptionGroup) => void;
  onRegroup: (g: ExceptionGroup) => void;
  onExplain: (g: ExceptionGroup) => void;
}) {
  const { appendMention } = useApp();
  const gridHeight = expandState === 'full' ? 600 : 400;

  const ExpandIcon = expandState === 'compact'
    ? ChevronsUpDown
    : expandState === 'medium'
      ? Maximize2
      : Minimize2;

  const expandTitle = expandState === 'compact'
    ? 'Expand (medium)'
    : expandState === 'medium'
      ? 'Expand (full)'
      : 'Collapse';

  return (
    <div className="card overflow-hidden" style={{ borderLeft: `4px solid ${group.color}` }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onCycleExpand}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">{group.name}</span>
            {group.accepted && <Badge variant="green">✓ Action Accepted</Badge>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{group.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-base font-bold text-gray-900">{fmt(group.totalValue)}</div>
          <div className="text-xs text-gray-500">
            {group.exceptions.length} exceptions · {group.totalQty.toLocaleString()} units
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onCycleExpand(); }}
          title={expandTitle}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          <ExpandIcon size={16} />
        </button>
      </div>

      {expandState !== 'compact' && (
        <>
          {/* AI Suggestion */}
          <div className="mx-5 mb-4 rounded-xl p-4 bg-blue-50 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-blue-800 mb-1">Suggested Action</div>
                <div className="text-sm text-blue-900 font-medium mb-1">{group.suggestedAction}</div>
                <div className="text-xs text-blue-700 leading-relaxed">{group.suggestedActionDetail}</div>
              </div>
            </div>
          </div>

          {/* Infinite scroll exception grid */}
          <div className="mx-5 mb-4">
            <InfiniteListGrid<PlanningException>
              rows={group.exceptions}
              columns={exceptionColumns}
              pageSize={30}
              height={gridHeight}
              exportFilename={`exceptions-${group.id}`}
              onShiftClick={exc =>
                appendMention(`@Product:${exc.productHierarchy}`)
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 px-5 pb-4">
            <button
              onClick={() => onAccept(group)}
              disabled={group.accepted}
              className="btn-success flex items-center gap-2 flex-1 justify-center"
            >
              <CheckCircle size={14} />
              {group.accepted ? 'Action Submitted' : 'Accept & Submit via MCP'}
            </button>
            <button onClick={() => onRegroup(group)} className="btn-secondary flex items-center gap-2">
              <GitBranch size={14} />
              Regroup
            </button>
            <button onClick={() => onExplain(group)} className="btn-secondary flex items-center gap-2">
              <MessageSquare size={14} />
              Explain Logic
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ExceptionAnalysis() {
  const [groups, setGroups] = useState<ExceptionGroup[]>(exceptionGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [expandStates, setExpandStates] = useState<Record<string, ExpandState>>({});
  const [acceptModal, setAcceptModal] = useState<ExceptionGroup | null>(null);
  const [regroupModal, setRegroupModal] = useState<ExceptionGroup | null>(null);
  const [explainModal, setExplainModal] = useState<ExceptionGroup | null>(null);
  const [showSelfHealing, setShowSelfHealing] = useState(false);
  const [regroupInput, setRegroupInput] = useState('');
  const [explainInput, setExplainInput] = useState('');

  const getExpandState = (id: string): ExpandState => expandStates[id] ?? 'compact';

  const cycleExpand = (id: string) => {
    setExpandStates(prev => {
      const cur = prev[id] ?? 'compact';
      const next: ExpandState =
        cur === 'compact' ? 'medium' : cur === 'medium' ? 'full' : 'compact';
      return { ...prev, [id]: next };
    });
  };

  const handleSelect = (id: string) => {
    setSelectedGroupId(id === selectedGroupId ? null : id);
    // Expand to medium if currently compact
    setExpandStates(prev => {
      const cur = prev[id] ?? 'compact';
      return cur === 'compact' ? { ...prev, [id]: 'medium' } : prev;
    });
  };

  const handleAcceptConfirm = () => {
    if (!acceptModal) return;
    setGroups(prev => prev.map(g => g.id === acceptModal.id ? { ...g, accepted: true } : g));
    setAcceptModal(null);
  };

  const totalValue = groups.reduce((s, g) => s + g.totalValue, 0);
  const totalExceptions = groups.reduce((s, g) => s + g.exceptions.length, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planning Run — Exception Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Run: <span className="font-medium text-gray-700">Feb 24, 2026 02:00 AM</span>
            {' · '}
            <span className="font-medium text-red-600">{totalExceptions} exceptions</span>
            {' · '}
            <span className="font-medium text-gray-700">{fmt(totalValue)} at risk</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSelfHealing(!showSelfHealing)}
            className="btn-secondary flex items-center gap-2"
          >
            <GitBranch size={14} />
            Self-Healing Logic
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <RefreshCw size={14} />
            Reload Run
          </button>
        </div>
      </div>

      {/* Fishbone */}
      <div className="mb-6">
        <FishboneDiagram
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelect={handleSelect}
        />
      </div>

      {/* Self-Healing Logic Panel */}
      {showSelfHealing && (
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={16} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-800">Self-Healing Business Logic</h2>
            <Badge variant="blue">{selfHealingRules.length} rules</Badge>
          </div>
          <div className="space-y-3">
            {selfHealingRules.map(rule => (
              <div key={rule.id} className="flex gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={12} className="text-amber-500" />
                    <span className="text-xs font-semibold text-gray-700">TRIGGER: {rule.trigger}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">IF: {rule.condition}</div>
                  <div className="flex items-center gap-1 text-xs font-medium text-blue-700">
                    <Wifi size={11} />
                    THEN: {rule.action}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-green-600">{rule.confidence}%</div>
                  <div className="text-xs text-gray-400">confidence</div>
                  <div className="text-xs text-gray-500 mt-1">{rule.timesApplied}× applied</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exception Groups */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Exception Groups</h2>
        {groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            expandState={getExpandState(group.id)}
            onCycleExpand={() => cycleExpand(group.id)}
            onAccept={setAcceptModal}
            onRegroup={setRegroupModal}
            onExplain={setExplainModal}
          />
        ))}
      </div>

      {/* Accept Confirmation Modal */}
      <Modal open={!!acceptModal} onClose={() => setAcceptModal(null)} title="Confirm Action">
        {acceptModal && (
          <div>
            <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 mb-4">
              <div className="text-sm font-semibold text-amber-800 mb-1">⚠ Action to be submitted via MCP</div>
              <div className="text-sm text-amber-900">{acceptModal.suggestedAction}</div>
            </div>
            <div className="text-sm text-gray-600 mb-2">This will submit the action to the corresponding system:</div>
            <ul className="text-sm text-gray-700 list-disc list-inside mb-4 space-y-1">
              <li>Target system: <strong>{acceptModal.actionType === 'notify_delay' ? 'SAP ECC — Customer Notification' : acceptModal.actionType === 'reallocate' ? 'SAP ECC — Transfer Order' : 'WMS — Expedite Queue'}</strong></li>
              <li>Exceptions affected: <strong>{acceptModal.exceptions.length}</strong></li>
              <li>Monetary value: <strong>{fmt(acceptModal.totalValue)}</strong></li>
            </ul>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setAcceptModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleAcceptConfirm} className="btn-success flex items-center gap-2">
                <CheckCircle size={14} />
                Confirm & Submit
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Regroup Modal */}
      <Modal open={!!regroupModal} onClose={() => setRegroupModal(null)} title="Propose Alternative Grouping">
        {regroupModal && (
          <div>
            <p className="text-sm text-gray-600 mb-3">Describe an alternative grouping or sub-grouping for the <strong>{regroupModal.name}</strong> exceptions.</p>
            <textarea
              value={regroupInput}
              onChange={e => setRegroupInput(e.target.value)}
              placeholder="E.g., 'Split by channel: separate online and in-store exceptions, apply express shipping for online only...'"
              className="input min-h-[100px] resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setRegroupModal(null); setRegroupInput(''); }} className="btn-secondary">Cancel</button>
              <button className="btn-primary flex items-center gap-2">
                <GitBranch size={14} />
                Apply Regrouping
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Explain Logic Modal */}
      <Modal open={!!explainModal} onClose={() => setExplainModal(null)} title="Explain Action Logic">
        {explainModal && (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Explain the reasoning behind your action for <strong>{explainModal.name}</strong>. This will feed the supply chain self-healing business logic.
            </p>
            <textarea
              value={explainInput}
              onChange={e => setExplainInput(e.target.value)}
              placeholder="E.g., 'When material is not available at the primary source and lead time for alternate DC is < 5 days, always prefer inter-DC transfer over customer notification...'"
              className="input min-h-[120px] resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setExplainModal(null); setExplainInput(''); }} className="btn-secondary">Cancel</button>
              <button className="btn-primary flex items-center gap-2">
                <DollarSign size={14} />
                Save to Self-Healing Logic
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
