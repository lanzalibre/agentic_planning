import { Eye, EyeOff } from 'lucide-react';
import { Modal } from '../shared/Modal';
import type { KPIWidget } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  widgets: KPIWidget[];
  onChange: (widgets: KPIWidget[]) => void;
}

const colorDot: Record<string, string> = {
  red: 'bg-red-500', amber: 'bg-amber-500', blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
};

export function KPIConfigModal({ open, onClose, widgets, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const visibleCount = widgets.filter(w => w.visible).length;

  return (
    <Modal open={open} onClose={onClose} title="Configure KPI Widgets">
      <p className="text-sm text-gray-500 mb-4">
        Select which KPI widgets to display on the overview dashboard. You can show up to 5 widgets.
      </p>
      <div className="flex flex-col gap-2">
        {widgets.map(widget => (
          <div
            key={widget.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer
              ${widget.visible ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
            onClick={() => toggle(widget.id)}
          >
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colorDot[widget.color]}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800">{widget.title}</div>
              <div className="text-xs text-gray-500 truncate">{widget.description}</div>
            </div>
            <button className={`flex-shrink-0 transition-colors ${widget.visible ? 'text-blue-600' : 'text-gray-300'}`}>
              {widget.visible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">{visibleCount} widget{visibleCount !== 1 ? 's' : ''} visible</span>
        <button onClick={onClose} className="btn-primary">Done</button>
      </div>
    </Modal>
  );
}
