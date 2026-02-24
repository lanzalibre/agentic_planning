import { TrendingUp, Construction } from 'lucide-react';

export function LongTermPlanning() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <TrendingUp size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Long Term Plan vs. Execution</h1>
          <p className="text-sm text-gray-500 mt-1">Compare the latest long term plan against actual execution data.</p>
        </div>
      </div>

      <div className="card p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Construction size={28} className="text-gray-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Coming Soon</h2>
          <p className="text-sm text-gray-400 mt-1 max-w-md">
            This section will provide a detailed comparison of your latest long term supply chain plan against actual execution data, highlighting variance trends and recommending strategic adjustments.
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          {['Demand Actuals vs. Forecast', 'Capacity Utilization', 'Inventory Turns', 'Strategic Stock Review'].map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 rounded-full px-3 py-1">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
