import { useApp } from '../context/AppContext';
import { LeadTimesValidation } from './LeadTimesValidation';
import { ThroughputValidation } from './ThroughputValidation';

export function PlanningConfiguration() {
  const { planningConfigTab, setPlanningConfigTab } = useApp();

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200 bg-white px-6 pt-4 flex-shrink-0">
        <button
          onClick={() => setPlanningConfigTab('lead-times')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
            ${planningConfigTab === 'lead-times'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Lead Times Validation
        </button>
        <button
          onClick={() => setPlanningConfigTab('throughput')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
            ${planningConfigTab === 'throughput'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Throughput Validation
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {planningConfigTab === 'lead-times' ? <LeadTimesValidation /> : <ThroughputValidation />}
      </div>
    </div>
  );
}
