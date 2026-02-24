import { AlertTriangle, Clock, Gauge, CheckCircle, Package, TrendingUp, TrendingDown, Minus, GripVertical } from 'lucide-react';
import type { KPIWidget as KPIWidgetType } from '../../types';

const iconMap: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle size={22} />,
  Clock:         <Clock size={22} />,
  Gauge:         <Gauge size={22} />,
  CheckCircle:   <CheckCircle size={22} />,
  Package:       <Package size={22} />,
};

const colorMap: Record<string, { bg: string; text: string; iconBg: string; border: string }> = {
  red:    { bg: 'bg-white',  text: 'text-red-600',    iconBg: 'bg-red-50',    border: 'border-red-100' },
  amber:  { bg: 'bg-white',  text: 'text-amber-600',  iconBg: 'bg-amber-50',  border: 'border-amber-100' },
  blue:   { bg: 'bg-white',  text: 'text-blue-600',   iconBg: 'bg-blue-50',   border: 'border-blue-100' },
  green:  { bg: 'bg-white',  text: 'text-green-600',  iconBg: 'bg-green-50',  border: 'border-green-100' },
  purple: { bg: 'bg-white',  text: 'text-purple-600', iconBg: 'bg-purple-50', border: 'border-purple-100' },
};

interface Props {
  widget: KPIWidgetType;
}

export function KPIWidget({ widget }: Props) {
  const c = colorMap[widget.color] ?? colorMap.blue;

  const trendIcon =
    widget.trend === 'up'   ? <TrendingUp size={14} /> :
    widget.trend === 'down' ? <TrendingDown size={14} /> :
                              <Minus size={14} />;

  const trendClass =
    // For exceptions/deviations, "up" is bad (red), "down" is good (green)
    widget.color === 'green'
      ? (widget.trend === 'down' ? 'text-red-500' : 'text-green-500')
      : (widget.trend === 'up' ? 'text-red-500' : widget.trend === 'down' ? 'text-green-500' : 'text-gray-400');

  return (
    <div className={`card p-5 flex flex-col gap-3 border ${c.border} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.text} flex items-center justify-center`}>
          {iconMap[widget.icon] ?? <AlertTriangle size={22} />}
        </div>
        <GripVertical size={16} className="text-gray-300 cursor-grab" />
      </div>
      <div>
        <div className={`text-3xl font-bold ${c.text}`}>
          {widget.value.toLocaleString()}{widget.unit ?? ''}
        </div>
        <div className="text-sm font-medium text-gray-700 mt-1 leading-snug">{widget.title}</div>
        <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{widget.description}</div>
      </div>
      {widget.trendValue !== 0 && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendClass}`}>
          {trendIcon}
          <span>{widget.trendValue > 0 ? '+' : ''}{widget.trendValue} vs. last run</span>
        </div>
      )}
    </div>
  );
}
