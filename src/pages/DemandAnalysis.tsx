import { useState, useCallback } from 'react';
import { BarChart3, Layers, DollarSign, Package, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ABCXYZChart } from '../components/demand/ABCXYZChart';
import { SunburstChart } from '../components/demand/SunburstChart';
import { MasterPanel } from '../components/demand/MasterPanel';
import type { HierarchyLevel, VolumeType, ComputedAggregate } from '../types';
import {
  productHierarchy,
  timeSeriesData,
  computeAggregatesByLevel,
} from '../data/mockData';

export function DemandAnalysis() {
  const { demandAnalysisTab, setDemandAnalysisTab } = useApp();
  const [hierarchyLevel, setHierarchyLevel] = useState<HierarchyLevel>(4);
  const [volumeType, setVolumeType] = useState<VolumeType>('monetary');
  const [selectedAggregate, setSelectedAggregate] = useState<ComputedAggregate | null>(null);
  const [showTimeSeries, setShowTimeSeries] = useState(false);
  const [aggregates, setAggregates] = useState<ComputedAggregate[]>(
    computeAggregatesByLevel(productHierarchy, timeSeriesData, 'monetary', 4)
  );

  // Always use level 4 for Sunburst chart (full hierarchy)
  const sunburstAggregates = computeAggregatesByLevel(productHierarchy, timeSeriesData, volumeType, 4);

  const handleHierarchyChange = (level: HierarchyLevel) => {
    setHierarchyLevel(level);
    setSelectedAggregate(null);
    setAggregates(computeAggregatesByLevel(productHierarchy, timeSeriesData, volumeType, level));
  };

  const handleVolumeChange = (type: VolumeType) => {
    setVolumeType(type);
    setSelectedAggregate(null);
    setAggregates(computeAggregatesByLevel(productHierarchy, timeSeriesData, type, hierarchyLevel));
  };

  const handleSelectAggregate = useCallback((aggregate: ComputedAggregate, openModal = true) => {
    setSelectedAggregate(aggregate);
    if (openModal) {
      setShowTimeSeries(true);
    }
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <BarChart3 size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Demand Analysis</h1>
        </div>
        <p className="text-gray-600 ml-13">
          Analyze forecasting performance across product hierarchies. Use ABC-XYZ classification to identify high-value/high-variance products.
        </p>
      </div>

      {/* Configuration Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-6">
          {/* Hierarchy Level - only show for ABC-XYZ tab */}
          {demandAnalysisTab === 'abc-xyz' && (
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Hierarchy Level:</span>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[1, 2, 3, 4].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleHierarchyChange(level as HierarchyLevel)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      hierarchyLevel === level
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Level {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Volume Type */}
          <div className="flex items-center gap-2">
            {volumeType === 'monetary' ? <DollarSign size={16} className="text-gray-500" /> : <Package size={16} className="text-gray-500" />}
            <span className="text-sm font-medium text-gray-700">Volume Type:</span>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleVolumeChange('monetary')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                  volumeType === 'monetary'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <DollarSign size={12} />
                Monetary
              </button>
              <button
                onClick={() => handleVolumeChange('quantity')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                  volumeType === 'quantity'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package size={12} />
                Quantity
              </button>
            </div>
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <select
              value="12m"
              disabled
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg border-0 cursor-not-allowed"
            >
              <option>Last 12 months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setDemandAnalysisTab('abc-xyz')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            demandAnalysisTab === 'abc-xyz'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          ABC-XYZ Analysis
        </button>
        <button
          onClick={() => setDemandAnalysisTab('sunburst')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            demandAnalysisTab === 'sunburst'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Hierarchy Breakdown
        </button>
      </div>

      {/* Tab Content — chart full width, table below */}
      <div className="flex flex-col gap-6">
        {/* Chart */}
        {demandAnalysisTab === 'abc-xyz' ? (
          <ABCXYZChart
            aggregates={aggregates}
            volumeType={volumeType}
            onSelectAggregate={handleSelectAggregate}
          />
        ) : (
          <SunburstChart
            aggregates={sunburstAggregates}
            volumeType={volumeType}
            hierarchyLevel={4}
            onSelectAggregate={handleSelectAggregate}
          />
        )}

        {/* Product Hierarchy table */}
        <MasterPanel
          aggregates={demandAnalysisTab === 'sunburst' ? sunburstAggregates : aggregates}
          volumeType={volumeType}
          selectedAggregate={selectedAggregate}
          showTimeSeries={showTimeSeries}
          onCloseTimeSeries={() => setShowTimeSeries(false)}
          onSelectAggregate={handleSelectAggregate}
        />
      </div>

      {/* Legend */}
      {demandAnalysisTab === 'abc-xyz' && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Classification Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="font-medium text-gray-900 mb-1">ABC Classification (Value)</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-600">A: Top 20% cumulative volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-600">B: Next 40% cumulative volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-gray-600">C: Remaining 40%</span>
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">XYZ Classification (Variance)</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">●</span>
                  <span className="text-gray-600">X: Variance &le; 20% (stable)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">◆</span>
                  <span className="text-gray-600">Y: 20% &lt; Variance &le; 40%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">■</span>
                  <span className="text-gray-600">Z: Variance &gt; 40% (unstable)</span>
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Recommendations</p>
              <div className="space-y-1 text-gray-600">
                <p>• AX: Standard forecasting</p>
                <p>• AZ/AY: Improved forecasting needed</p>
                <p>• BX/CX: Focus forecast efforts</p>
                <p>• CZ: High variability - buffer stock</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
