import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ComputedAggregate, VolumeType } from '../../types';

interface ABCXYZChartProps {
  aggregates: ComputedAggregate[];
  volumeType: VolumeType;
  onSelectAggregate: (aggregate: ComputedAggregate) => void;
}

// ── Squarified treemap ────────────────────────────────────────────────────────
interface Rect { x: number; y: number; w: number; h: number; }

function worstRatio(row: number[], shortEdge: number): number {
  if (!row.length) return Infinity;
  const s = row.reduce((a, b) => a + b, 0);
  if (s === 0) return Infinity;
  const max = Math.max(...row), min = Math.min(...row);
  const se2 = shortEdge * shortEdge;
  return Math.max(se2 * max / (s * s), s * s / (se2 * min));
}

function squarify(areas: number[], container: Rect): Rect[] {
  if (!areas.length) return [];
  const total = areas.reduce((a, b) => a + b, 0);
  if (total === 0 || container.w <= 0 || container.h <= 0) return areas.map(() => ({ ...container }));
  const ca = container.w * container.h;
  const norm = areas.map(a => (a / total) * ca);
  const order = norm.map((_, i) => i).sort((a, b) => norm[b] - norm[a]);
  const sortedRects = _strip(order.map(i => norm[i]), container);
  const result = new Array<Rect>(areas.length);
  order.forEach((orig, si) => { result[orig] = sortedRects[si]; });
  return result;
}

function _strip(items: number[], rect: Rect): Rect[] {
  if (!items.length) return [];
  if (items.length === 1) return [rect];
  const { x, y, w, h } = rect;
  const wide = w >= h, s = wide ? h : w;
  let row = [items[0]], rowEnd = 1;
  for (let i = 1; i < items.length; i++) {
    const cand = [...row, items[i]];
    if (worstRatio(cand, s) > worstRatio(row, s)) break;
    row = cand; rowEnd = i + 1;
  }
  const rowSum = row.reduce((a, b) => a + b, 0);
  const thick = rowSum / s;
  const result: Rect[] = [];
  let off = 0;
  for (const a of row) {
    const len = (a / rowSum) * s;
    result.push(wide ? { x, y: y + off, w: thick, h: len } : { x: x + off, y, w: len, h: thick });
    off += len;
  }
  const rest = items.slice(rowEnd);
  if (rest.length) {
    const nxt: Rect = wide ? { x: x + thick, y, w: w - thick, h } : { x, y: y + thick, w, h: h - thick };
    result.push(..._strip(rest, nxt));
  }
  return result;
}

// ── Colors ────────────────────────────────────────────────────────────────────
const CELL_COLOR: Record<string, string> = {
  AX: '#1d4ed8', AY: '#6d28d9', AZ: '#be185d',
  BX: '#047857', BY: '#0369a1', BZ: '#4d7c0f',
  CX: '#b91c1c', CY: '#b45309', CZ: '#c2410c',
};
const LABEL_FG: Record<string, string> = {
  AX: '#bfdbfe', AY: '#ddd6fe', AZ: '#fce7f3',
  BX: '#a7f3d0', BY: '#bae6fd', BZ: '#ecfccb',
  CX: '#fecaca', CY: '#fde68a', CZ: '#fed7aa',
};

const ROWS = ['A', 'B', 'C'] as const;
const COLS = ['X', 'Y', 'Z'] as const;

// ── Layout constants ──────────────────────────────────────────────────────────
const W = 740, H = 590;
const ML = 56;   // left margin (row labels + axis title)
const MB = 54;   // bottom margin (col labels + axis title)
const MT = 8;    // top margin
const MR = 10;   // right margin
const CW = W - ML - MR;  // chart area width
const CH = H - MT - MB;  // chart area height
const GAP = 1.5;
const LBL_H = 16;

// ── Component ─────────────────────────────────────────────────────────────────
export function ABCXYZChart({ aggregates, volumeType, onSelectAggregate }: ABCXYZChartProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tip, setTip] = useState<{ agg: ComputedAggregate; sx: number; sy: number } | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const layout = useMemo(() => {
    if (!aggregates.length) return null;

    // Group aggregates into 9 cells
    const groups = new Map<string, ComputedAggregate[]>(
      ROWS.flatMap(r => COLS.map(c => [`${r}${c}`, [] as ComputedAggregate[]]))
    );
    for (const agg of aggregates) {
      groups.get(`${agg.abcClass}${agg.xyzClass}`)?.push(agg);
    }

    const gVol = (key: string) => (groups.get(key) ?? []).reduce((s, a) => s + a.volumeTotal, 0);

    // Row totals → row heights (proportional)
    const rowTotals = ROWS.map(r => COLS.reduce((s, c) => s + gVol(`${r}${c}`), 0));
    const rowGT     = rowTotals.reduce((s, v) => s + v, 0);
    const rowH      = rowTotals.map(v => (v / rowGT) * CH);
    const rowY      = [MT, MT + rowH[0], MT + rowH[0] + rowH[1]];

    // Col totals → col widths (proportional)
    const colTotals = COLS.map(c => ROWS.reduce((s, r) => s + gVol(`${r}${c}`), 0));
    const colGT     = colTotals.reduce((s, v) => s + v, 0);
    const colW      = colTotals.map(v => (v / colGT) * CW);
    const colX      = [ML, ML + colW[0], ML + colW[0] + colW[1]];

    // Build cell layout
    const cells = ROWS.flatMap((r, ri) =>
      COLS.map((c, ci) => {
        const key  = `${r}${c}`;
        const aggs = groups.get(key)!;
        const x = colX[ci], y = rowY[ri], w = colW[ci], h = rowH[ri];
        const inner: Rect = {
          x: x + GAP,
          y: y + LBL_H,
          w: Math.max(0, w - GAP * 2),
          h: Math.max(0, h - LBL_H - GAP),
        };
        const rects = (aggs.length && inner.w > 1 && inner.h > 1)
          ? squarify(aggs.map(a => a.volumeTotal), inner)
          : [];
        return { key, x, y, w, h, items: aggs.map((agg, i) => ({ agg, rect: rects[i] })) };
      })
    );

    return { cells, rowH, rowY, colW, colX, rowTotals, colTotals };
  }, [aggregates]);

  const toSvg = (e: React.MouseEvent<SVGElement>): [number, number] => {
    const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
  };

  const fmt = (v: number) =>
    v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v | 0}`;

  if (!layout) return null;
  const { cells, rowH, rowY, colW, colX } = layout;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>

        {/* ── Axis titles ── */}
        {/* Vertical: "Volume" rotated */}
        <text
          x={-(MT + CH / 2)} y={14}
          fill="#6b7280" fontSize={11} fontWeight={600}
          textAnchor="middle" dominantBaseline="middle"
          transform="rotate(-90)" fontFamily="system-ui,sans-serif"
        >
          Volume ({volumeType === 'monetary' ? '$' : 'qty'}) ↑
        </text>

        {/* Horizontal: "Variance %" */}
        <text
          x={ML + CW / 2} y={H - 6}
          fill="#6b7280" fontSize={11} fontWeight={600}
          textAnchor="middle" fontFamily="system-ui,sans-serif"
        >
          Variance %  →
        </text>

        {/* ── Row axis labels (A / B / C) ── */}
        {ROWS.map((r, ri) => (
          <text
            key={`rowlbl-${r}`}
            x={ML - 8} y={rowY[ri] + rowH[ri] / 2}
            fill="#374151" fontSize={13} fontWeight={700}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="system-ui,sans-serif"
          >
            {r}
          </text>
        ))}

        {/* ── Col axis labels (X / Y / Z) with variance bands ── */}
        {COLS.map((c, ci) => {
          const bandLabel = c === 'X' ? '≤20%' : c === 'Y' ? '20–40%' : '>40%';
          return (
            <g key={`collbl-${c}`}>
              <text
                x={colX[ci] + colW[ci] / 2} y={MT + CH + 14}
                fill="#374151" fontSize={13} fontWeight={700}
                textAnchor="middle" fontFamily="system-ui,sans-serif"
              >
                {c}
              </text>
              <text
                x={colX[ci] + colW[ci] / 2} y={MT + CH + 28}
                fill="#9ca3af" fontSize={9}
                textAnchor="middle" fontFamily="system-ui,sans-serif"
              >
                {bandLabel}
              </text>
            </g>
          );
        })}

        {/* ── Cell fills + group labels ── */}
        {cells.map(({ key, x, y, w, h }) => {
          if (w < 2 || h < 2) return null;
          const color = CELL_COLOR[key];
          const fg    = LABEL_FG[key];
          return (
            <g key={`cell-${key}`}>
              <rect x={x} y={y} width={w} height={h}
                fill={color} stroke="white" strokeWidth={1.5} />
              {w > 22 && h > 14 && (
                <text x={x + 5} y={y + 12}
                  fill={fg} fontSize={11} fontWeight={700}
                  fontFamily="system-ui,sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {key}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Inner sub-boxes ── */}
        {cells.map(({ key, items }) =>
          items.map(({ agg, rect }) => {
            if (!rect || rect.w < 1 || rect.h < 1) return null;
            const color  = CELL_COLOR[key];
            const isHov  = hoverId === agg.elementId;
            const label  = agg.hierarchyPath.split('/').pop() ?? '';
            const fs     = Math.min(10, rect.h / 2.4, rect.w / 4);
            const showLbl = rect.w >= 28 && rect.h >= 12 && fs >= 5;
            return (
              <g key={agg.elementId}>
                <rect
                  x={rect.x + 0.5} y={rect.y + 0.5}
                  width={Math.max(0, rect.w - 1)} height={Math.max(0, rect.h - 1)}
                  fill={color} stroke="rgba(255,255,255,0.65)" strokeWidth={0.7}
                  opacity={isHov ? 0.58 : 0.85}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => {
                    setHoverId(agg.elementId);
                    const [sx, sy] = toSvg(e); setTip({ agg, sx, sy });
                  }}
                  onMouseMove={e => {
                    const [sx, sy] = toSvg(e);
                    setTip(p => p ? { ...p, sx, sy } : null);
                  }}
                  onMouseLeave={() => { setHoverId(null); setTip(null); }}
                  onClick={() => onSelectAggregate(agg)}
                />
                {showLbl && (
                  <text
                    x={rect.x + rect.w / 2} y={rect.y + rect.h / 2}
                    fill="white" fontSize={fs} fontWeight={500}
                    textAnchor="middle" dominantBaseline="middle"
                    fontFamily="system-ui,sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {label.length > 13 ? label.slice(0, 12) + '…' : label}
                  </text>
                )}
              </g>
            );
          })
        )}

        {/* ── Grid lines (between rows and cols) ── */}
        {/* Horizontal separator lines */}
        {[1, 2].map(i => (
          <line key={`hline-${i}`}
            x1={ML} y1={rowY[i]} x2={ML + CW} y2={rowY[i]}
            stroke="white" strokeWidth={2} />
        ))}
        {/* Vertical separator lines */}
        {[1, 2].map(i => (
          <line key={`vline-${i}`}
            x1={colX[i]} y1={MT} x2={colX[i]} y2={MT + CH}
            stroke="white" strokeWidth={2} />
        ))}

        {/* ── Tooltip ── */}
        {tip && (() => {
          const { agg, sx, sy } = tip;
          const tw = 230, th = 76;
          const tx = Math.min(sx + 12, W - tw - 6);
          const ty = Math.max(sy - th / 2, 4);
          const parts = agg.hierarchyPath.split('/');
          const name  = parts.pop()!;
          const bread = parts.join(' › ');
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tx} y={ty} width={tw} height={th} rx={5}
                fill="rgba(10,10,22,0.92)" stroke="rgba(255,255,255,0.2)" strokeWidth={0.8} />
              <text x={tx + 8} y={ty + 13} fill="#64748b" fontSize={9}
                fontFamily="system-ui,sans-serif">{bread}</text>
              <text x={tx + 8} y={ty + 29} fill="white" fontSize={12} fontWeight={600}
                fontFamily="system-ui,sans-serif">
                {name.length > 25 ? name.slice(0, 24) + '…' : name}
              </text>
              <text x={tx + 8} y={ty + 46} fill="#e2e8f0" fontSize={10}
                fontFamily="system-ui,sans-serif">
                {volumeType === 'monetary' ? 'Revenue' : 'Qty'}: {fmt(agg.volumeTotal)}
              </text>
              <text x={tx + 8} y={ty + 62} fill="#94a3b8" fontSize={10}
                fontFamily="system-ui,sans-serif">
                {agg.abcClass}{agg.xyzClass} · Variance: {agg.variancePercent.toFixed(1)}%
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setShowLegend(v => !v)}
          className="flex items-center gap-1 w-full px-4 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {showLegend ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          {showLegend ? 'Hide legend' : 'Show legend'}
        </button>
        {showLegend && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-2.5 text-xs text-gray-600">
            <span className="font-medium text-gray-700 mr-1">Cells:</span>
            {(Object.keys(CELL_COLOR) as string[]).map(k => (
              <span key={k} className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ background: CELL_COLOR[k] }} />
                {k}
              </span>
            ))}
            <span className="text-gray-400 ml-auto">
              Cell &amp; sub-box area = {volumeType === 'monetary' ? 'revenue' : 'quantity'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
