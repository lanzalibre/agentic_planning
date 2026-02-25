import { useMemo } from 'react';
import { InfiniteListGrid, GridColumn } from '../shared/InfiniteListGrid';
import type { ComputedAggregate, VolumeType } from '../../types';
import { TimeSeriesViewer } from './TimeSeriesViewer';
import { DollarSign, Package } from 'lucide-react';

interface MasterPanelProps {
  aggregates: ComputedAggregate[];
  volumeType: VolumeType;
  selectedAggregate: ComputedAggregate | null;
  showTimeSeries: boolean;
  onCloseTimeSeries: () => void;
  onSelectAggregate: (aggregate: ComputedAggregate) => void;
}

export function MasterPanel({
  aggregates,
  volumeType,
  selectedAggregate,
  showTimeSeries,
  onCloseTimeSeries,
  onSelectAggregate,
}: MasterPanelProps) {

  // InfiniteListGrid requires T extends { id: string }; map elementId → id
  const rowsWithId = useMemo(
    () => aggregates.map(a => ({ ...a, id: a.elementId })),
    [aggregates],
  );

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const formatQuantity = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString();
  };

  const columns: GridColumn<ComputedAggregate>[] = [
    {
      key: 'hierarchyPath',
      label: 'Hierarchy Path',
      render: (row) => (
        <div className="truncate" title={row.hierarchyPath}>
          {row.hierarchyPath}
        </div>
      ),
      csvValue: (row) => row.hierarchyPath,
    },
    {
      key: 'volumeTotal',
      label: 'Volume',
      headerClass: 'text-right',
      cellClass: 'text-right font-mono text-gray-700',
      render: (row) => volumeType === 'monetary' ? formatVolume(row.volumeTotal) : formatQuantity(row.volumeTotal),
      csvValue: (row) => row.volumeTotal.toString(),
    },
    {
      key: 'variancePercent',
      label: 'Variance',
      headerClass: 'text-right',
      cellClass: 'text-right font-mono',
      render: (row) => `${row.variancePercent.toFixed(1)}%`,
      csvValue: (row) => row.variancePercent.toFixed(2),
    },
    {
      key: 'abcClass',
      label: 'ABC',
      headerClass: 'text-center',
      cellClass: 'text-center',
      render: (row) => (
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
          row.abcClass === 'A' ? 'bg-blue-100 text-blue-700' :
          row.abcClass === 'B' ? 'bg-green-100 text-green-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {row.abcClass}
        </span>
      ),
      csvValue: (row) => row.abcClass,
    },
    {
      key: 'xyzClass',
      label: 'XYZ',
      headerClass: 'text-center',
      cellClass: 'text-center',
      render: (row) => (
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
          row.xyzClass === 'X' ? 'bg-gray-100 text-gray-700' :
          row.xyzClass === 'Y' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {row.xyzClass}
        </span>
      ),
      csvValue: (row) => row.xyzClass,
    },
  ];

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Product Hierarchy</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {volumeType === 'monetary' ? <DollarSign size={14} /> : <Package size={14} />}
            <span>{volumeType === 'monetary' ? 'Monetary' : 'Quantity'}</span>
          </div>
        </div>

        {/* Grid */}
        <InfiniteListGrid
          rows={rowsWithId}
          columns={columns}
          pageSize={20}
          height={320}
          exportFilename={`demand-analysis-${volumeType}-level4`}
          onClick={(row) => onSelectAggregate(row)}
          onShiftClick={(row) => onSelectAggregate(row)}
          selectedId={selectedAggregate?.elementId}
        />
      </div>

      {/* Time Series Viewer Modal */}
      {selectedAggregate && (
        <TimeSeriesViewer
          open={showTimeSeries}
          onClose={onCloseTimeSeries}
          aggregate={selectedAggregate}
          volumeType={volumeType}
        />
      )}
    </>
  );
}
