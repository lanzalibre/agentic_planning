import React, { useMemo, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ComputedAggregate, VolumeType } from '../../types';

interface SunburstChartProps {
  aggregates: ComputedAggregate[];
  volumeType: VolumeType;
  hierarchyLevel: 1 | 2 | 3 | 4;
  onSelectAggregate: (aggregate: ComputedAggregate) => void;
}

// ── Plasma colormap (matplotlib) ─────────────────────────────────────────────
function plasmaColor(t: number): string {
  t = Math.max(0, Math.min(1, t));
  const stops: [number, number, number][] = [
    [13,  8,   135],
    [70,  3,   159],
    [114, 1,   168],
    [156, 23,  158],
    [189, 55,  134],
    [216, 87,  107],
    [237, 121, 83],
    [251, 159, 58],
    [253, 202, 38],
    [240, 249, 33],
  ];
  const n = stops.length - 1;
  const i = Math.min(Math.floor(t * n), n - 1);
  const f = t * n - i;
  const [r0, g0, b0] = stops[i];
  const [r1, g1, b1] = stops[i + 1];
  return `rgb(${~~(r0 + f*(r1-r0))},${~~(g0 + f*(g1-g0))},${~~(b0 + f*(b1-b0))})`;
}

// ── Tree ─────────────────────────────────────────────────────────────────────
interface TreeNode {
  id: string;
  label: string;
  level: number;
  path: string;
  volume: number;
  variancePercent: number;       // volume-weighted avg variance for color coding
  varianceWeightedSum: number;   // accumulated during tree build
  children: TreeNode[];
  startAngle: number;
  endAngle: number;
  color: string;
  aggregate: ComputedAggregate | null;
}

function buildTree(aggs: ComputedAggregate[]): TreeNode {
  const root: TreeNode = {
    id: '__root__', label: '', level: 0, path: '',
    volume: 0, variancePercent: 0, varianceWeightedSum: 0,
    children: [], startAngle: 0, endAngle: 2 * Math.PI,
    color: '', aggregate: null,
  };
  for (const agg of aggs) {
    const parts = agg.hierarchyPath.split('/');
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const path = parts.slice(0, i + 1).join('/');
      let child = cur.children.find(c => c.path === path);
      if (!child) {
        child = {
          id: path, label: parts[i], level: i + 1, path,
          volume: 0, variancePercent: 0, varianceWeightedSum: 0,
          children: [], startAngle: 0, endAngle: 0,
          color: '', aggregate: null,
        };
        cur.children.push(child);
      }
      child.volume += agg.volumeTotal;
      // Accumulate volume-weighted variance so inner nodes can derive an average
      child.varianceWeightedSum += agg.variancePercent * agg.volumeTotal;
      if (i === parts.length - 1) child.aggregate = agg;
      cur = child;
    }
  }
  root.volume = root.children.reduce((s, c) => s + c.volume, 0);
  return root;
}

function layoutTree(node: TreeNode, start: number, end: number): void {
  node.startAngle = start;
  node.endAngle = end;
  if (!node.children.length) return;
  node.children.sort((a, b) => b.volume - a.volume);
  let cur = start;
  for (const child of node.children) {
    const span = (child.volume / node.volume) * (end - start);
    layoutTree(child, cur, cur + span);
    cur += span;
  }
}

function collectAll(node: TreeNode, out: TreeNode[] = []): TreeNode[] {
  if (node.level > 0 && node.level <= 4) out.push(node);
  for (const c of node.children) collectAll(c, out);
  return out;
}

// ── SVG arc path (annular sector) ────────────────────────────────────────────
function arcPath(
  cx: number, cy: number,
  r1: number, r2: number,
  a1: number, a2: number,
): string {
  const span = a2 - a1;
  if (span <= 1e-9) return '';
  const a2c = span >= 2 * Math.PI - 1e-6 ? a1 + 2 * Math.PI - 1e-6 : a2;
  const large = a2c - a1 > Math.PI ? 1 : 0;
  const c = Math.cos, s = Math.sin;
  const ox1 = cx + r2 * c(a1),  oy1 = cy + r2 * s(a1);
  const ox2 = cx + r2 * c(a2c), oy2 = cy + r2 * s(a2c);
  const ix2 = cx + r1 * c(a2c), iy2 = cy + r1 * s(a2c);
  const ix1 = cx + r1 * c(a1),  iy1 = cy + r1 * s(a1);
  return `M${ox1} ${oy1} A${r2} ${r2} 0 ${large} 1 ${ox2} ${oy2} L${ix2} ${iy2} A${r1} ${r1} 0 ${large} 0 ${ix1} ${iy1}Z`;
}

// ── Layout constants ─────────────────────────────────────────────────────────
const W       = 800;
const H       = 740;
const CX      = 315;
const CY      = 390;
const INNER_R = 60;
const RING_W  = 66;
const BG      = '#0b0b0b';

// ── Component ────────────────────────────────────────────────────────────────
export function SunburstChart({ aggregates, volumeType, onSelectAggregate }: SunburstChartProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [tooltip, setTooltip] = useState<{
    node: TreeNode; svgX: number; svgY: number;
  } | null>(null);

  const { allNodes, minVar, maxVar } = useMemo(() => {
    const root = buildTree(aggregates);
    layoutTree(root, -Math.PI / 2, 3 * Math.PI / 2);
    const all = collectAll(root);
    // Compute volume-weighted average variance for each node
    all.forEach(n => {
      n.variancePercent = n.volume > 0 ? n.varianceWeightedSum / n.volume : 0;
    });
    const variances = all.map(n => n.variancePercent);
    const minVar = Math.min(...variances);
    const maxVar = Math.max(...variances);
    const norm = (v: number) =>
      maxVar === minVar ? 0.5 : (v - minVar) / (maxVar - minVar);
    all.forEach(n => { n.color = plasmaColor(norm(n.variancePercent)); });
    return { allNodes: all, minVar, maxVar };
  }, [aggregates]);

  const toSvgCoords = (e: React.MouseEvent): [number, number] => {
    const rect = (e.currentTarget as SVGElement).ownerSVGElement!.getBoundingClientRect();
    return [
      (e.clientX - rect.left) * (W / rect.width),
      (e.clientY - rect.top)  * (H / rect.height),
    ];
  };

  const handleEnter = useCallback((node: TreeNode, e: React.MouseEvent<SVGPathElement>) => {
    const [svgX, svgY] = toSvgCoords(e);
    setHoverId(node.id);
    setTooltip({ node, svgX, svgY });
  }, []);

  const handleMove = useCallback((node: TreeNode, e: React.MouseEvent<SVGPathElement>) => {
    const [svgX, svgY] = toSvgCoords(e);
    setTooltip({ node, svgX, svgY });
  }, []);

  const handleLeave = useCallback(() => {
    setHoverId(null);
    setTooltip(null);
  }, []);

  const handleClick = useCallback((node: TreeNode) => {
    onSelectAggregate(node.aggregate ?? {
      elementId: node.id,
      hierarchyPath: node.path,
      volumeTotal: node.volume,
      variancePercent: node.variancePercent,
      abcClass: 'B',
      xyzClass: 'Y',
      aggregates: {},
    });
  }, [onSelectAggregate]);

  const fmtVol = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
    return String(Math.round(v));
  };

  // Legend geometry
  const LX = 700, LY1 = 80, LY2 = 650, LW = 18;

  // Gradient stops for legend — offset 0% = top = high value (yellow), 100% = bottom = low (dark blue)
  const gradStops = Array.from({ length: 11 }, (_, i) => {
    const t = 1 - i / 10;               // t=1 at top, t=0 at bottom
    return { offset: `${(i / 10) * 100}%`, color: plasmaColor(t) };
  });

  return (
    <div style={{ background: BG, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header with legend toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 0' }}>
        <span style={{ color: '#dde3ed', fontSize: 13, fontWeight: 500, fontFamily: 'system-ui, sans-serif' }}>
          ABC-XYZ Classified Time Series: Hierarchical Volume Distribution
        </span>
        <button
          onClick={() => setShowLegend(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#64748b', fontSize: 11, fontFamily: 'system-ui, sans-serif',
          }}
        >
          {showLegend ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showLegend ? 'Hide legend' : 'Show legend'}
        </button>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block' }}
      >
        <rect width={W} height={H} fill={BG} />

        {/* Gradient def for legend */}
        <defs>
          <linearGradient id="plasma-grad" x1="0" y1="0" x2="0" y2="1">
            {gradStops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>

        {/* Arc segments */}
        {allNodes.map(node => {
          const r1      = INNER_R + (node.level - 1) * RING_W;
          const r2      = r1 + RING_W;
          const d       = arcPath(CX, CY, r1 + 0.8, r2 - 0.8, node.startAngle, node.endAngle);
          if (!d) return null;

          const midAngle = (node.startAngle + node.endAngle) / 2;
          const midR     = (r1 + r2) / 2;
          const mx       = CX + midR * Math.cos(midAngle);
          const my       = CY + midR * Math.sin(midAngle);
          const arcLen   = midR * (node.endAngle - node.startAngle);

          // Base font sizes per level
          const baseFsMap: Record<number, number> = { 1: 13, 2: 11, 3: 9, 4: 8 };
          const fs = Math.min(baseFsMap[node.level] ?? 8, arcLen / 5);
          const showLabel = arcLen > 14 && fs >= 5;

          // Radial rotation: text points outward; flip for left half
          const deg = midAngle * (180 / Math.PI) + (Math.cos(midAngle) < 0 ? 180 : 0);

          // Char limit based on radial ring width available
          const maxChars = Math.max(2, Math.floor(RING_W / (fs * 0.62)));
          const rawLabel = node.label;
          const labelText = rawLabel.length > maxChars
            ? rawLabel.slice(0, maxChars - 1) + '…'
            : rawLabel;

          const isHovered = hoverId === node.id;

          return (
            <g key={node.id}>
              <path
                d={d}
                fill={node.color}
                stroke={BG}
                strokeWidth={0.6}
                opacity={isHovered ? 0.72 : 1}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => handleEnter(node, e)}
                onMouseMove={e => handleMove(node, e)}
                onMouseLeave={handleLeave}
                onClick={() => handleClick(node)}
              />
              {showLabel && (
                <text
                  x={mx} y={my}
                  fill="white"
                  fontSize={fs}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${deg},${mx},${my})`}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                  fontFamily="system-ui, sans-serif"
                >
                  {labelText}
                </text>
              )}
            </g>
          );
        })}

        {/* Center hub */}
        <circle cx={CX} cy={CY} r={INNER_R - 1} fill="#17112e" />

        {/* Legend bar */}
        {showLegend && (
          <g>
            <rect x={LX} y={LY1} width={LW} height={LY2 - LY1} fill="url(#plasma-grad)" />
            <text
              x={LX + LW / 2} y={LY1 - 14}
              fill="#94a3b8" fontSize={11} textAnchor="middle"
              fontFamily="system-ui, sans-serif"
            >
              variance %
            </text>
            {[1, 0.75, 0.5, 0.25, 0].map(t => {
              const y = LY1 + (1 - t) * (LY2 - LY1);
              const v = minVar + t * (maxVar - minVar);
              return (
                <g key={t}>
                  <line
                    x1={LX + LW} y1={y} x2={LX + LW + 5} y2={y}
                    stroke="#64748b" strokeWidth={1}
                  />
                  <text
                    x={LX + LW + 8} y={y}
                    fill="#94a3b8" fontSize={9}
                    dominantBaseline="middle"
                    fontFamily="system-ui, sans-serif"
                  >
                    {v.toFixed(1)}%
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* SVG tooltip */}
        {tooltip && (() => {
          const { node, svgX, svgY } = tooltip;
          const parts = node.path.split('/');
          const breadcrumb = parts.length > 1 ? parts.slice(0, -1).join(' › ') : '';
          const tw = 220, th = breadcrumb ? 80 : 64;
          const tx = Math.min(svgX + 14, W - tw - 8);
          const ty = Math.max(svgY - th / 2, 8);
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={tx} y={ty} width={tw} height={th} rx={6}
                fill="rgba(5,5,15,0.88)" stroke="rgba(255,255,255,0.18)" strokeWidth={0.8}
              />
              {breadcrumb && (
                <text x={tx + 9} y={ty + 15} fill="#64748b" fontSize={9}
                  fontFamily="system-ui, sans-serif">
                  {breadcrumb}
                </text>
              )}
              <text
                x={tx + 9} y={ty + (breadcrumb ? 30 : 20)}
                fill="white" fontSize={12} fontWeight={600}
                fontFamily="system-ui, sans-serif"
              >
                {node.label}
              </text>
              <text
                x={tx + 9} y={ty + (breadcrumb ? 46 : 36)}
                fill="#cbd5e1" fontSize={10}
                fontFamily="system-ui, sans-serif"
              >
                {volumeType === 'monetary' ? 'Revenue' : 'Qty'}: {fmtVol(node.volume)}
              </text>
              <text
                x={tx + 9} y={ty + (breadcrumb ? 62 : 52)}
                fill="#94a3b8" fontSize={10}
                fontFamily="system-ui, sans-serif"
              >
                Variance: {node.variancePercent.toFixed(1)}%
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
