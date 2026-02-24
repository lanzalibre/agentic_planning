import type { ExceptionGroup } from '../../types';

interface Props {
  groups: ExceptionGroup[];
  selectedGroupId: string | null;
  onSelect: (id: string) => void;
}

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;

export function FishboneDiagram({ groups, selectedGroupId, onSelect }: Props) {
  const W = 860;
  const H = 340;
  const spineY = H / 2;
  const spineStart = 40;
  const spineEnd = W - 100;
  const headX = W - 60;
  const headY = spineY;

  // Place bones: alternating above/below the spine
  // Each bone connects from a point on the spine to a label area
  const bonePositions = groups.map((g, i) => {
    const isUpper = i % 2 === 0;
    // Space bones evenly along the spine
    const xBase = spineStart + 80 + i * Math.floor((spineEnd - spineStart - 120) / (groups.length));
    const labelX = xBase - 60;
    const labelY = isUpper ? spineY - 120 : spineY + 120;
    const tipX = xBase;
    const tipY = spineY + (isUpper ? -5 : 5);
    return { group: g, isUpper, labelX, labelY, tipX, tipY, xBase };
  });

  const totalValue = groups.reduce((s, g) => s + g.totalValue, 0);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Exception Analysis — Fishbone Diagram</h2>
          <p className="text-xs text-gray-500 mt-0.5">Planning run: Feb 24, 2026 02:00 AM · Total at-risk value: <span className="font-medium text-gray-700">{fmt(totalValue)}</span></p>
        </div>
        <div className="text-xs text-gray-400">Click a group to view details ↓</div>
      </div>

      <div className="p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 600 }}>
          {/* Spine */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#1e40af" />
            </marker>
          </defs>
          <line
            x1={spineStart} y1={spineY}
            x2={spineEnd} y2={spineY}
            stroke="#1e40af" strokeWidth="3"
            markerEnd="url(#arrowhead)"
          />

          {/* Effect box */}
          <rect x={headX - 10} y={headY - 36} width={80} height={72} rx="8" fill="#1e40af" />
          <text x={headX + 30} y={headY - 14} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">142</text>
          <text x={headX + 30} y={headY}      textAnchor="middle" fill="white" fontSize="9">Planning</text>
          <text x={headX + 30} y={headY + 12} textAnchor="middle" fill="white" fontSize="9">Exceptions</text>

          {/* Bones */}
          {bonePositions.map(({ group, isUpper, labelX, labelY, tipX, tipY }) => {
            const isSelected = selectedGroupId === group.id;
            const color = group.color;
            const midX = (labelX + 40 + tipX) / 2;
            const midY = (labelY + tipY) / 2;

            return (
              <g key={group.id} onClick={() => onSelect(group.id)} style={{ cursor: 'pointer' }}>
                {/* Bone line */}
                <line
                  x1={labelX + 20} y1={labelY}
                  x2={tipX} y2={tipY}
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray={isSelected ? undefined : undefined}
                  opacity={isSelected ? 1 : 0.7}
                />

                {/* Label card */}
                <rect
                  x={labelX - 50}
                  y={isUpper ? labelY - 52 : labelY + 4}
                  width={140}
                  height={52}
                  rx="8"
                  fill={isSelected ? color : group.bgColor}
                  stroke={color}
                  strokeWidth={isSelected ? 2 : 1}
                />
                <text
                  x={labelX + 20}
                  y={isUpper ? labelY - 34 : labelY + 22}
                  textAnchor="middle"
                  fill={isSelected ? 'white' : color}
                  fontSize="9"
                  fontWeight="bold"
                >
                  {group.name.split(' ').slice(0, 2).join(' ')}
                </text>
                <text
                  x={labelX + 20}
                  y={isUpper ? labelY - 22 : labelY + 34}
                  textAnchor="middle"
                  fill={isSelected ? 'rgba(255,255,255,0.85)' : '#6b7280'}
                  fontSize="8"
                >
                  {group.name.split(' ').slice(2).join(' ')}
                </text>
                <text
                  x={labelX + 20}
                  y={isUpper ? labelY - 10 : labelY + 46}
                  textAnchor="middle"
                  fill={isSelected ? 'rgba(255,255,255,0.9)' : '#374151'}
                  fontSize="9"
                  fontWeight="600"
                >
                  {fmt(group.totalValue)} · {group.exceptions.length} exc.
                </text>

                {/* Sub-bones for exceptions (small tick marks) */}
                {group.exceptions.slice(0, 4).map((_, ei) => {
                  const t = (ei + 1) / (group.exceptions.length + 1);
                  const bx = labelX + 20 + t * (tipX - labelX - 20);
                  const by = labelY + t * (tipY - labelY);
                  const tickLen = 12;
                  const perpX = isUpper ? -tickLen * 0.6 : tickLen * 0.6;
                  const perpY = isUpper ? -tickLen * 0.8 : tickLen * 0.8;
                  return (
                    <line
                      key={ei}
                      x1={bx} y1={by}
                      x2={bx + perpX} y2={by + perpY}
                      stroke={color}
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  );
                })}

                {/* Mid-point value bubble */}
                <circle cx={midX} cy={midY} r="12" fill="white" stroke={color} strokeWidth="1" opacity="0.9" />
                <text x={midX} y={midY + 4} textAnchor="middle" fill={color} fontSize="8" fontWeight="bold">
                  {group.exceptions.length}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="px-5 pb-4 flex gap-4">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            className="flex items-center gap-2 text-xs rounded-full px-3 py-1 border transition-colors"
            style={{
              borderColor: g.color,
              color: selectedGroupId === g.id ? 'white' : g.color,
              backgroundColor: selectedGroupId === g.id ? g.color : g.bgColor,
            }}
          >
            <span className="font-medium">{g.name}</span>
            <span className="opacity-75">{g.exceptions.length}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
