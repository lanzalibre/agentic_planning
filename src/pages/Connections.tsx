import { Plus, Wifi, WifiOff, AlertCircle, Loader, RefreshCw, Trash2, Settings } from 'lucide-react';
import { useState } from 'react';
import { defaultConnections } from '../data/mockData';
import type { Connection, ConnectionStatus } from '../types';
import { Badge } from '../components/shared/Badge';

const categories = ['ERP', 'Planning Software', 'MES', 'Data Warehouse', 'File Systems'];

const statusConfig: Record<ConnectionStatus, { label: string; icon: React.ReactNode; variant: 'green' | 'gray' | 'red' | 'amber' }> = {
  connected:    { label: 'Connected',    icon: <Wifi size={12} />,     variant: 'green' },
  disconnected: { label: 'Disconnected', icon: <WifiOff size={12} />,  variant: 'gray' },
  error:        { label: 'Error',        icon: <AlertCircle size={12}/>, variant: 'red' },
  pending:      { label: 'Pending',      icon: <Loader size={12} />,   variant: 'amber' },
};

const vendorColors: Record<string, string> = {
  SAP: 'bg-blue-600', Oracle: 'bg-red-600', 'Blue Yonder': 'bg-teal-600',
  Kinaxis: 'bg-indigo-600', 'Siemens Opcenter': 'bg-green-600', 'Rockwell FactoryTalk': 'bg-orange-600',
  Snowflake: 'bg-sky-500', Databricks: 'bg-orange-500', AWS: 'bg-amber-500', 'Local/SharePoint': 'bg-slate-500',
};

export function Connections() {
  const [connections, setConnections] = useState<Connection[]>(defaultConnections);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [testing, setTesting] = useState<string | null>(null);

  const allCategories = ['All', ...categories];
  const filtered = activeCategory === 'All' ? connections : connections.filter(c => c.category === activeCategory);

  const handleTest = (id: string) => {
    setTesting(id);
    setTimeout(() => {
      setConnections(prev =>
        prev.map(c => c.id === id ? { ...c, status: Math.random() > 0.2 ? 'connected' : 'error', lastSync: 'Just now' } : c)
      );
      setTesting(null);
    }, 1500);
  };

  const handleToggle = (id: string) => {
    setConnections(prev =>
      prev.map(c => c.id === id
        ? { ...c, status: c.status === 'connected' ? 'disconnected' : 'pending' }
        : c
      )
    );
    setTimeout(() => {
      setConnections(prev =>
        prev.map(c => c.id === id && c.status === 'pending'
          ? { ...c, status: 'connected', lastSync: 'Just now' }
          : c
        )
      );
    }, 1200);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MCP Connections</h1>
          <p className="text-sm text-gray-500 mt-1">Configure connections to your ERP, planning, MES, and data systems via Model Context Protocol.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={15} />
          Add Connection
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {cat}
            {cat !== 'All' && (
              <span className={`ml-1.5 text-xs ${activeCategory === cat ? 'text-blue-200' : 'text-gray-400'}`}>
                ({connections.filter(c => c.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Connection cards grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(conn => {
          const sc = statusConfig[conn.status];
          const vendorColor = vendorColors[conn.vendor] ?? 'bg-slate-500';
          const isTesting = testing === conn.id;
          return (
            <div key={conn.id} className="card p-5 flex flex-col gap-4">
              {/* Top row */}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${vendorColor} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold text-xs">{conn.vendor.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{conn.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{conn.category} · {conn.vendor}</div>
                </div>
                <Badge variant={sc.variant}>
                  <span className="flex items-center gap-1">{sc.icon}{sc.label}</span>
                </Badge>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed">{conn.description}</p>

              {/* Host info */}
              {conn.host && (
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-400">Host</div>
                  <div className="text-xs font-mono text-gray-700 truncate">{conn.host}{conn.port ? `:${conn.port}` : ''}</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-gray-400">
                  {conn.lastSync ? `Synced: ${conn.lastSync}` : 'Never synced'}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTest(conn.id)}
                    disabled={isTesting}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    {isTesting ? <Loader size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Test
                  </button>
                  <button
                    onClick={() => handleToggle(conn.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      conn.status === 'connected'
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    }`}
                  >
                    {conn.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings size={14} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
