import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Modal } from '../shared/Modal';
import type { ComputedAggregate, VolumeType, TimeSeriesData } from '../../types';
import { productHierarchy, timeSeriesData } from '../../data/mockData';
import { Download } from 'lucide-react';

interface TimeSeriesViewerProps {
  open: boolean;
  onClose: () => void;
  aggregate: ComputedAggregate;
  volumeType: VolumeType;
}

export function TimeSeriesViewer({ open, onClose, aggregate, volumeType }: TimeSeriesViewerProps) {
  // Find products that match this aggregate's hierarchy path
  const pathParts = aggregate.hierarchyPath.split('/');
  const matchingProducts = productHierarchy.filter(p => {
    if (pathParts.length === 1) return p.level1 === pathParts[0];
    if (pathParts.length === 2) return p.level1 === pathParts[0] && p.level2 === pathParts[1];
    if (pathParts.length === 3) return p.level1 === pathParts[0] && p.level2 === pathParts[1] && p.level3 === pathParts[2];
    if (pathParts.length === 4) return p.level1 === pathParts[0] && p.level2 === pathParts[1] && p.level3 === pathParts[2] && p.level4 === pathParts[3];
    return false;
  });

  // Aggregate time series data for matching products
  const productIds = matchingProducts.map(p => p.id);
  const aggregatedTimeSeries = new Map<string, { salesQty: number; salesVolume: number; lag1: number; lag5: number; lag10: number; lag15: number; count: number }>();

  for (const ts of timeSeriesData) {
    if (!productIds.includes(ts.productId)) continue;
    const existing = aggregatedTimeSeries.get(ts.period) || { salesQty: 0, salesVolume: 0, lag1: 0, lag5: 0, lag10: 0, lag15: 0, count: 0 };
    existing.salesQty += ts.salesQty;
    existing.salesVolume += ts.salesVolume;
    if (ts.forecasts.lag1 !== null) existing.lag1 += ts.forecasts.lag1;
    if (ts.forecasts.lag5 !== null) existing.lag5 += ts.forecasts.lag5;
    if (ts.forecasts.lag10 !== null) existing.lag10 += ts.forecasts.lag10;
    if (ts.forecasts.lag15 !== null) existing.lag15 += ts.forecasts.lag15;
    existing.count += 1;
    aggregatedTimeSeries.set(ts.period, existing);
  }

  // Convert to chart data
  const chartData = Array.from(aggregatedTimeSeries.entries())
    .map(([period, values]) => ({
      period,
      salesQty: values.count > 0 ? Math.round(values.salesQty / values.count) : 0,
      salesVolume: values.count > 0 ? Math.round(values.salesVolume / values.count) : 0,
      lag1: values.count > 0 ? Math.round(values.lag1 / values.count) : null,
      lag5: values.count > 0 ? Math.round(values.lag5 / values.count) : null,
      lag10: values.count > 0 ? Math.round(values.lag10 / values.count) : null,
      lag15: values.count > 0 ? Math.round(values.lag15 / values.count) : null,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-24); // Last 24 months

  // Format Y-axis values
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return volumeType === 'monetary' ? `$${(value / 1000).toFixed(0)}K` : `${(value / 1000).toFixed(0)}K`;
    return volumeType === 'monetary' ? `$${value}` : value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExport = () => {
    const header = ['Period', 'Actual Sales', 'Forecast Lag 1', 'Forecast Lag 5', 'Forecast Lag 10', 'Forecast Lag 15'];
    const body = chartData.map(row => [
      row.period,
      volumeType === 'monetary' ? row.salesVolume : row.salesQty,
      row.lag1 ?? '',
      row.lag5 ?? '',
      row.lag10 ?? '',
      row.lag15 ?? '',
    ].join(','));
    const csv = `${header.join(',')}\n${body.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeseries-${aggregate.elementId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Time Series: ${aggregate.hierarchyPath}`} width="max-w-4xl">
      {/* Aggregate Values */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium">Total Volume</p>
          <p className="text-sm font-semibold text-blue-900">{formatValue(aggregate.volumeTotal)}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3">
          <p className="text-xs text-amber-600 font-medium">Variance</p>
          <p className="text-sm font-semibold text-amber-900">{aggregate.variancePercent.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 font-medium">ABC Class</p>
          <p className="text-sm font-semibold text-gray-900">{aggregate.abcClass}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 font-medium">XYZ Class</p>
          <p className="text-sm font-semibold text-gray-900">{aggregate.xyzClass}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => {
                const [year, month] = value.split('-');
                return `${month}/${year.substring(2)}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey={volumeType === 'monetary' ? 'salesVolume' : 'salesQty'}
              name="Actual Sales"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={volumeType === 'monetary' ? 'lag1' : 'lag1'}
              name="Forecast (Lag 1)"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey={volumeType === 'monetary' ? 'lag5' : 'lag5'}
              name="Forecast (Lag 5)"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Legend */}
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Lag values represent forecasts made 1, 5, 10, and 15 months ahead. Dashed lines indicate forecast accuracy degrades with longer horizons.
        </p>
      </div>
    </Modal>
  );
}
