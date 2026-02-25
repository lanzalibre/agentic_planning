import { Home, Plug, AlertTriangle, SlidersHorizontal, BarChart3, TrendingUp, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { PageId } from '../../types';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'overview',           label: 'Overview',         icon: <Home size={20} /> },
  { id: 'exception-analysis', label: 'Planning Runs',    icon: <AlertTriangle size={20} />, badge: 142 },
  { id: 'planning-config',    label: 'Planning Config',  icon: <SlidersHorizontal size={20} />, badge: 40 },
  { id: 'demand-analysis',    label: 'Demand Analysis',  icon: <BarChart3 size={20} /> },
  { id: 'long-term',          label: 'Long Term Plan',   icon: <TrendingUp size={20} /> },
  { id: 'connections',        label: 'Connections',      icon: <Plug size={20} /> },
];

export function RightNavbar() {
  const { currentPage, setCurrentPage } = useApp();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ${expanded ? 'w-52' : 'w-16'} h-full z-10 shadow-xl`}
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-14 border-b border-slate-700 px-3 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">SC</span>
        </div>
        {expanded && (
          <span className="ml-3 text-sm font-semibold text-white whitespace-nowrap">SpinnakerSCA</span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {navItems.map(item => {
          const isActive = currentPage === item.id ||
            (item.id === 'planning-config' && (currentPage === 'lead-times' || currentPage === 'throughput'));
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              title={!expanded ? item.label : undefined}
              className={`relative flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors w-full text-left
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {expanded && <span className="truncate whitespace-nowrap">{item.label}</span>}
              {item.badge !== undefined && (
                <span
                  className={`absolute top-1 right-1 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1
                    ${isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Expand/Collapse Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-center h-10 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        title={expanded ? 'Collapse' : 'Expand'}
      >
        {expanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  );
}
