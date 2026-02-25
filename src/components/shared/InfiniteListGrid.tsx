import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';

export interface GridColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  csvValue?: (row: T) => string;
  headerClass?: string;
  cellClass?: string;
}

export interface InfiniteListGridProps<T extends { id: string }> {
  rows: T[];
  columns: GridColumn<T>[];
  pageSize?: number;
  onClick?: (row: T) => void;
  onShiftClick?: (row: T) => void;
  exportFilename?: string;
  height?: number;
  selectedId?: string;
}

export function InfiniteListGrid<T extends { id: string }>({
  rows,
  columns,
  pageSize = 30,
  onClick,
  onShiftClick,
  exportFilename,
  height = 400,
  selectedId,
}: InfiniteListGridProps<T>) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Reset when rows change
  useEffect(() => {
    setVisibleCount(pageSize);
    rowRefs.current.clear();
  }, [rows, pageSize]);

  // When selectedId changes, ensure the row is in the visible set
  useEffect(() => {
    if (!selectedId) return;
    const idx = rows.findIndex(r => r.id === selectedId);
    if (idx >= 0 && idx >= visibleCount) {
      setVisibleCount(idx + 1);
    }
  }, [selectedId, rows]);

  // Scroll to selected row once it is rendered
  useEffect(() => {
    if (!selectedId) return;
    const el = rowRefs.current.get(selectedId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId, visibleCount]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = containerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(prev => Math.min(prev + pageSize, rows.length));
        }
      },
      { root: container, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [rows.length, pageSize, visibleCount]);

  const handleExport = () => {
    const header = columns.map(c => JSON.stringify(c.label)).join(',');
    const body = rows.map(row =>
      columns.map(c => {
        const val = c.csvValue ? c.csvValue(row) : '';
        return JSON.stringify(val);
      }).join(',')
    ).join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename ?? 'export'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const visibleRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-1.5">
        <span className="text-xs text-gray-500">
          {visibleCount < rows.length
            ? `Showing ${visibleCount} of ${rows.length} rows`
            : `${rows.length} rows`}
          {onShiftClick && <span className="ml-2 text-gray-400">· Shift+click to mention in chat</span>}
        </span>
        {exportFilename && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <Download size={12} />
            Export CSV
          </button>
        )}
      </div>

      {/* Scrollable area */}
      <div ref={containerRef} className="overflow-y-auto" style={{ height }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map(c => (
                <th
                  key={c.key}
                  className={`py-2 px-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap ${c.headerClass ?? ''}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(row => {
              const isSelected = row.id === selectedId;
              return (
              <tr
                key={row.id}
                ref={el => {
                  if (el) rowRefs.current.set(row.id, el);
                  else rowRefs.current.delete(row.id);
                }}
                className={`border-b text-xs transition-colors
                  ${isSelected
                    ? 'bg-blue-100 border-blue-200'
                    : (onClick || onShiftClick)
                      ? 'border-gray-50 cursor-pointer hover:bg-blue-50 select-none'
                      : 'border-gray-50 hover:bg-gray-50'}`}
                onClick={e => {
                  if (e.shiftKey && onShiftClick) {
                    e.preventDefault();
                    onShiftClick(row);
                  } else if (!e.shiftKey && onClick) {
                    onClick(row);
                  }
                }}
              >
                {columns.map(c => (
                  <td key={c.key} className={`py-2 px-3 ${c.cellClass ?? ''}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );})}
          </tbody>
        </table>

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div
            ref={sentinelRef}
            className="h-8 flex items-center justify-center text-xs text-gray-400"
          >
            Loading more…
          </div>
        )}

        {!hasMore && rows.length > pageSize && (
          <div className="h-6 flex items-center justify-center text-xs text-gray-400">
            — end of list —
          </div>
        )}
      </div>
    </div>
  );
}
