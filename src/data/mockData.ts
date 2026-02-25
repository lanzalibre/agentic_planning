import type {
  KPIWidget,
  Connection,
  ExceptionGroup,
  LeadTime,
  ActualLeadTime,
  Resource,
  ActualThroughput,
  SelfHealingRule,
  Channel,
  Product,
  ProductCategory,
  TimeSeriesData,
  DerivedSeriesConfig,
  AggregateConfig,
  ComputedAggregate,
} from '../types';

// ─── KPI Widgets ─────────────────────────────────────────────────────────────

export const defaultKPIWidgets: KPIWidget[] = [
  {
    id: 'exceptions',
    title: 'Planning Exceptions',
    value: 520,
    visible: true,
    color: 'red',
    icon: 'AlertTriangle',
    trend: 'up',
    trendValue: 18,
    description: 'Number of exceptions in the last planning run',
  },
  {
    id: 'lead-times-off',
    title: 'Lead Times Deviating >30%',
    value: 23,
    visible: true,
    color: 'amber',
    icon: 'Clock',
    trend: 'down',
    trendValue: 5,
    description: 'Planning tool lead times 30%+ off from actually observed',
  },
  {
    id: 'throughput-off',
    title: 'Throughput Entries Deviating >30%',
    value: 17,
    visible: true,
    color: 'blue',
    icon: 'Gauge',
    trend: 'flat',
    trendValue: 0,
    description: 'Planning tool throughput entries 30%+ off from actually observed',
  },
  {
    id: 'on-time-delivery',
    title: 'On-Time Delivery Rate',
    value: 87,
    unit: '%',
    visible: false,
    color: 'green',
    icon: 'CheckCircle',
    trend: 'down',
    trendValue: 3,
    description: 'Percentage of orders delivered on time this period',
  },
  {
    id: 'open-orders',
    title: 'Open Orders at Risk',
    value: 64,
    visible: false,
    color: 'purple',
    icon: 'Package',
    trend: 'up',
    trendValue: 12,
    description: 'Open orders flagged as at risk of missing committed date',
  },
];

// ─── Connections ─────────────────────────────────────────────────────────────

export const defaultConnections: Connection[] = [
  // ERP
  { id: 'sap-ecc', category: 'ERP', name: 'SAP ECC 6.0', vendor: 'SAP', status: 'connected', host: 'sap-prod.internal', port: '8000', description: 'Main ERP system — production environment', lastSync: '2 min ago' },
  { id: 'sap-s4', category: 'ERP', name: 'SAP S/4HANA', vendor: 'SAP', status: 'disconnected', host: 'sap-s4.internal', port: '44300', description: 'SAP S/4HANA migration target', lastSync: '3 days ago' },
  { id: 'oracle-erp', category: 'ERP', name: 'Oracle Fusion ERP', vendor: 'Oracle', status: 'error', host: 'oracle-cloud.acme.com', port: '443', description: 'Oracle Cloud ERP for North America', lastSync: '1 hour ago' },
  // Planning
  { id: 'by-apo', category: 'Planning Software', name: 'Blue Yonder APO', vendor: 'Blue Yonder', status: 'connected', host: 'by-apo.internal', port: '50000', description: 'Supply chain planning — demand & supply', lastSync: '5 min ago' },
  { id: 'kinaxis', category: 'Planning Software', name: 'Kinaxis RapidResponse', vendor: 'Kinaxis', status: 'pending', host: 'acme.kinaxis.com', port: '443', description: 'Concurrent planning platform', lastSync: 'Never' },
  // MES
  { id: 'mes-mx', category: 'MES', name: 'MES — MFG Mexico', vendor: 'Siemens Opcenter', status: 'connected', host: 'mes-mx.internal', port: '9000', description: 'Manufacturing Execution System — Monterrey plant', lastSync: '1 min ago' },
  { id: 'mes-mi', category: 'MES', name: 'MES — MFG Michigan', vendor: 'Rockwell FactoryTalk', status: 'connected', host: 'mes-mi.internal', port: '9001', description: 'Manufacturing Execution System — Michigan plant', lastSync: '3 min ago' },
  // Data
  { id: 'snowflake', category: 'Data Warehouse', name: 'Snowflake', vendor: 'Snowflake', status: 'connected', host: 'acme.snowflakecomputing.com', port: '443', description: 'Central data warehouse for analytics', lastSync: '10 min ago' },
  { id: 'databricks', category: 'Data Warehouse', name: 'Databricks', vendor: 'Databricks', status: 'disconnected', host: 'adb-xxxxx.azuredatabricks.net', port: '443', description: 'ML platform and feature store', lastSync: '2 days ago' },
  // Files
  { id: 's3-prod', category: 'File Systems', name: 'S3 — Production Bucket', vendor: 'AWS', status: 'connected', host: 's3.us-east-1.amazonaws.com', description: 'Primary S3 bucket for data exports/imports', lastSync: '8 min ago' },
  { id: 's3-archive', category: 'File Systems', name: 'S3 — Archive Bucket', vendor: 'AWS', status: 'connected', host: 's3.us-west-2.amazonaws.com', description: 'Historical planning data archive', lastSync: '1 day ago' },
  { id: 'excel-folder', category: 'File Systems', name: 'Excel File Folder', vendor: 'Local/SharePoint', status: 'connected', host: 'sharepoint.acme.com/sites/planning', description: 'Shared Excel files for manual overrides', lastSync: '30 min ago' },
];

// ─── Exception Analysis ───────────────────────────────────────────────────────

const channels: Channel[] = ['online', 'in-store', 'wholesale'];

function generateExceptions(
  groupId: string,
  count: number,
  products: string[],
  skus: string[],
  startIdxOffset: number,
): { exceptions: PlanningException[]; totalValue: number; totalQty: number } {
  const exceptions: import('../types').PlanningException[] = [];
  let totalValue = 0;
  let totalQty = 0;

  for (let i = 0; i < count; i++) {
    const prod = products[i % products.length];
    const channel = channels[i % channels.length];
    const sku = skus[i % skus.length];
    // Spread start dates across Feb–Apr 2026
    const startDayOffset = (i * 13 + startIdxOffset * 7) % 60;
    const duration = 5 + ((i * 11 + 3) % 26); // 5–30 days
    const from = new Date(2026, 1, 20 + startDayOffset % 30);
    const to = new Date(from.getTime() + duration * 86400000);
    const qty = 50 + ((i * 137 + startIdxOffset * 41 + 17) % 4950);
    const unitVal = 80 + ((i * 97 + startIdxOffset * 23 + 11) % 1920);
    const value = qty * unitVal;
    totalQty += qty;
    totalValue += value;
    exceptions.push({
      id: `${groupId}-exc-${i}`,
      productHierarchy: prod,
      channel,
      periodFrom: from.toISOString().split('T')[0],
      periodTo: to.toISOString().split('T')[0],
      quantity: qty,
      monetaryValue: value,
      sku,
    });
  }
  return { exceptions, totalValue, totalQty };
}

type PlanningException = import('../types').PlanningException;

const g1 = generateExceptions(
  'group-1',
  252,
  [
    'Electronics/Consumer/ABC-1', 'Electronics/Consumer/ABC-2', 'Electronics/Consumer/ABC-3',
    'Electronics/Pro/XYZ-5', 'Electronics/Pro/XYZ-8', 'Electronics/Pro/XYZ-11',
    'Electronics/Components/EC-3', 'Electronics/Components/EC-7', 'Electronics/Components/EC-12',
  ],
  ['SKU-10042', 'SKU-10043', 'SKU-10044', 'SKU-20018', 'SKU-20021', 'SKU-30001', 'SKU-30002'],
  0,
);

const g2 = generateExceptions(
  'group-2',
  161,
  [
    'Appliances/HVAC/HV-3', 'Appliances/HVAC/HV-7', 'Appliances/HVAC/HV-11',
    'Appliances/Kitchen/KT-2', 'Appliances/Kitchen/KT-9',
    'Appliances/Laundry/LT-4', 'Appliances/Laundry/LT-7',
  ],
  ['SKU-30011', 'SKU-30017', 'SKU-30022', 'SKU-40005', 'SKU-40008', 'SKU-40012'],
  1,
);

const g3 = generateExceptions(
  'group-3',
  109,
  [
    'Industrial/Tools/IT-8', 'Industrial/Tools/IT-12', 'Industrial/Tools/IT-19',
    'Industrial/Safety/IS-3', 'Industrial/Safety/IS-9',
    'Industrial/Equipment/IE-2', 'Industrial/Equipment/IE-7',
  ],
  ['SKU-50022', 'SKU-50028', 'SKU-50033', 'SKU-60007', 'SKU-60012', 'SKU-70001'],
  2,
);

export const exceptionGroups: ExceptionGroup[] = [
  {
    id: 'group-1',
    name: 'Material Not Available',
    description: 'Orders associated to product hierarchies: Electronics/Consumer, Electronics/Pro, Electronics/Components',
    color: '#dc2626',
    bgColor: '#fef2f2',
    totalValue: g1.totalValue,
    totalQty: g1.totalQty,
    actionType: 'notify_delay',
    suggestedAction: 'Notify customers that all affected orders can only be delivered by 03/28/2026.',
    suggestedActionDetail: 'Root cause: Component shortage at MFG Mexico (PCB-4420). Earliest feasible ship date is 03/25/2026. Suggested delivery commitment: 03/28/2026. Draft customer notification ready.',
    selfHealingCategory: 'Supply Shortage → Customer Notification',
    exceptions: g1.exceptions,
  },
  {
    id: 'group-2',
    name: 'Material Available at Alternate Location',
    description: 'Orders associated to product hierarchies: Appliances/HVAC, Appliances/Kitchen, Appliances/Laundry',
    color: '#d97706',
    bgColor: '#fffbeb',
    totalValue: g2.totalValue,
    totalQty: g2.totalQty,
    actionType: 'reallocate',
    suggestedAction: 'Reallocate inventory from DC Nebraska to DC Louisiana to fulfill affected orders.',
    suggestedActionDetail: 'DC Nebraska has 6,200 units of the required SKUs. Transfer lead time: 3 days (truck). All orders can be fulfilled within original delivery window. Estimated transfer cost: $18,400.',
    selfHealingCategory: 'Inventory Reallocation → DC Transfer',
    exceptions: g2.exceptions,
  },
  {
    id: 'group-3',
    name: 'Order Stuck at Warehouse',
    description: 'Orders associated to product hierarchies: Industrial/Tools, Industrial/Safety, Industrial/Equipment',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    totalValue: g3.totalValue,
    totalQty: g3.totalQty,
    actionType: 'expedite',
    suggestedAction: 'Expedite warehouse processing for orders stuck >48h. Escalate to DC Louisiana warehouse manager.',
    suggestedActionDetail: 'Orders have been in "pick pending" status at DC Louisiana for 48-72h due to a WMS configuration issue (pick wave not triggered for zone C). IT ticket #WMS-4421 filed. Manual expedite available. Estimated clearance time: 4 hours.',
    selfHealingCategory: 'Warehouse Delay → Expedite + IT Escalation',
    exceptions: g3.exceptions,
  },
];

export const selfHealingRules: SelfHealingRule[] = [
  { id: 'r1', trigger: 'Material shortage detected at primary MFG site', condition: 'No alternate source available within lead time window', action: 'Generate customer delay notification + revised delivery date', confidence: 94, timesApplied: 31 },
  { id: 'r2', trigger: 'Material shortage detected at primary MFG site', condition: 'Same SKU available at alternate DC', action: 'Create inter-DC transfer order + update promise dates', confidence: 88, timesApplied: 47 },
  { id: 'r3', trigger: 'Order stuck in WMS > 24h', condition: 'Pick wave not triggered', action: 'Escalate to warehouse manager + file IT ticket + expedite manually', confidence: 96, timesApplied: 12 },
  { id: 'r4', trigger: 'Lead time deviation > 30%', condition: '3+ consecutive shipments above threshold', action: 'Flag for planning parameter review + suggest updated lead time', confidence: 82, timesApplied: 23 },
];

// ─── Lead Times ───────────────────────────────────────────────────────────────

export const leadTimes: LeadTime[] = [
  { id: 'lt-1',  fromLocation: 'MFG Mexico',   toLocation: 'DC Louisiana',     transport: 'truck', plannedDays: 5,  avgDeviation: 2.8, totalDeviation: 47.2, aiSuggestedDays: 7,  selected: false },
  { id: 'lt-2',  fromLocation: 'MFG Michigan',  toLocation: 'DC Nebraska',      transport: 'truck', plannedDays: 3,  avgDeviation: 1.9, totalDeviation: 38.1, aiSuggestedDays: 4,  selected: false },
  { id: 'lt-3',  fromLocation: 'Supplier CN',   toLocation: 'MFG Mexico',       transport: 'boat',  plannedDays: 22, avgDeviation: 1.6, totalDeviation: 35.6, aiSuggestedDays: 28, selected: false },
  { id: 'lt-4',  fromLocation: 'MFG Mexico',    toLocation: 'DC Nebraska',      transport: 'truck', plannedDays: 6,  avgDeviation: 1.7, totalDeviation: 32.4, aiSuggestedDays: 8,  selected: false },
  { id: 'lt-5',  fromLocation: 'Supplier IN',   toLocation: 'MFG Michigan',     transport: 'air',   plannedDays: 4,  avgDeviation: 1.4, totalDeviation: 28.9, aiSuggestedDays: 5,  selected: false },
  { id: 'lt-6',  fromLocation: 'DC Louisiana',  toLocation: 'Cust Atlanta',     transport: 'truck', plannedDays: 2,  avgDeviation: 1.2, totalDeviation: 24.7, aiSuggestedDays: 3,  selected: false },
  { id: 'lt-7',  fromLocation: 'Supplier DE',   toLocation: 'MFG Michigan',     transport: 'boat',  plannedDays: 18, avgDeviation: 0.9, totalDeviation: 21.3, aiSuggestedDays: 22, selected: false },
  { id: 'lt-8',  fromLocation: 'MFG Michigan',  toLocation: 'DC Louisiana',     transport: 'truck', plannedDays: 4,  avgDeviation: 0.8, totalDeviation: 19.8, aiSuggestedDays: 5,  selected: false },
  { id: 'lt-9',  fromLocation: 'DC Nebraska',   toLocation: 'Cust Chicago',     transport: 'truck', plannedDays: 2,  avgDeviation: 0.7, totalDeviation: 17.2, aiSuggestedDays: 2,  selected: false },
  { id: 'lt-10', fromLocation: 'Supplier MX',   toLocation: 'MFG Mexico',       transport: 'truck', plannedDays: 1,  avgDeviation: 0.6, totalDeviation: 15.4, aiSuggestedDays: 2,  selected: false },
  { id: 'lt-11', fromLocation: 'MFG Mexico',    toLocation: 'Cust Miami',       transport: 'truck', plannedDays: 3,  avgDeviation: 0.5, totalDeviation: 12.1, aiSuggestedDays: 4,  selected: false },
  { id: 'lt-12', fromLocation: 'DC Nebraska',   toLocation: 'Cust Denver',      transport: 'truck', plannedDays: 1,  avgDeviation: 0.4, totalDeviation: 10.3, aiSuggestedDays: 2,  selected: false },
  { id: 'lt-13', fromLocation: 'Supplier BR',   toLocation: 'MFG Michigan',     transport: 'boat',  plannedDays: 28, avgDeviation: 0.4, totalDeviation: 9.6,  aiSuggestedDays: 30, selected: false },
  { id: 'lt-14', fromLocation: 'MFG Michigan',  toLocation: 'Cust Detroit',     transport: 'truck', plannedDays: 1,  avgDeviation: 0.3, totalDeviation: 8.2,  aiSuggestedDays: 1,  selected: false },
  { id: 'lt-15', fromLocation: 'DC Louisiana',  toLocation: 'Cust Houston',     transport: 'truck', plannedDays: 1,  avgDeviation: 0.2, totalDeviation: 6.8,  aiSuggestedDays: 2,  selected: false },
  { id: 'lt-16', fromLocation: 'Supplier CN',   toLocation: 'MFG Michigan',     transport: 'air',   plannedDays: 5,  avgDeviation: 0.2, totalDeviation: 5.9,  aiSuggestedDays: 6,  selected: false },
  { id: 'lt-17', fromLocation: 'MFG Mexico',    toLocation: 'DC Phoenix',       transport: 'truck', plannedDays: 2,  avgDeviation: 0.1, totalDeviation: 4.4,  aiSuggestedDays: 2,  selected: false },
  { id: 'lt-18', fromLocation: 'DC Nebraska',   toLocation: 'Cust Kansas City', transport: 'truck', plannedDays: 1,  avgDeviation: 0.1, totalDeviation: 3.2,  aiSuggestedDays: 1,  selected: false },
  { id: 'lt-19', fromLocation: 'Supplier JP',   toLocation: 'MFG Michigan',     transport: 'boat',  plannedDays: 25, avgDeviation: 0.1, totalDeviation: 2.1,  aiSuggestedDays: 25, selected: false },
  { id: 'lt-20', fromLocation: 'MFG Michigan',  toLocation: 'Cust Columbus',    transport: 'truck', plannedDays: 1,  avgDeviation: 0.1, totalDeviation: 1.4,  aiSuggestedDays: 1,  selected: false },
];

// Varied shipment counts per lane (range 4–18)
const shipmentCounts: Record<string, number> = {
  'lt-1': 14, 'lt-2': 9,  'lt-3': 6,  'lt-4': 12, 'lt-5': 8,
  'lt-6': 17, 'lt-7': 5,  'lt-8': 11, 'lt-9': 15, 'lt-10': 7,
  'lt-11': 13, 'lt-12': 18, 'lt-13': 4, 'lt-14': 16, 'lt-15': 10,
  'lt-16': 12, 'lt-17': 6,  'lt-18': 14, 'lt-19': 8, 'lt-20': 18,
};

const makeActuals = (leadTimeId: string, plannedDays: number): ActualLeadTime[] => {
  const refs = ['SH-28441', 'SH-28109', 'SH-27832', 'SH-27614', 'SH-27290', 'SH-26981', 'SH-26703', 'SH-26445', 'SH-26120', 'SH-25894', 'SH-25601', 'SH-25312', 'SH-25074', 'SH-24891', 'SH-24602', 'SH-24311', 'SH-24028', 'SH-23745'];
  const count = shipmentCounts[leadTimeId] ?? 10;
  return Array.from({ length: count }, (_, i) => {
    const delta = (Math.random() * 6 - 1) | 0;
    const actual = Math.max(1, plannedDays + delta);
    const pickup = new Date(2026, 0, 8 + i * 3);
    const dropoff = new Date(pickup.getTime() + actual * 86400000);
    return {
      id: `act-${leadTimeId}-${i}`,
      leadTimeId,
      shipmentRef: refs[i % refs.length],
      pickupDate: pickup.toISOString().split('T')[0],
      dropoffDate: dropoff.toISOString().split('T')[0],
      actualDays: actual,
      deltaVsPlanned: actual - plannedDays,
    };
  });
};

export const actualLeadTimesMap: Record<string, ActualLeadTime[]> = Object.fromEntries(
  leadTimes.map(lt => [lt.id, makeActuals(lt.id, lt.plannedDays)])
);

// ─── Resources / Throughput ───────────────────────────────────────────────────

export const resources: Resource[] = [
  { id: 'res-1',  name: 'Assembly Line A1',    location: 'MFG Mexico',   plannedThroughput: 240,  plannedUptimeHours: 8,  totalDeviation: 52.3, aiSuggestedThroughput: 185,  selected: false },
  { id: 'res-2',  name: 'Assembly Line B2',    location: 'MFG Mexico',   plannedThroughput: 260,  plannedUptimeHours: 8,  totalDeviation: 41.8, aiSuggestedThroughput: 210,  selected: false },
  { id: 'res-3',  name: 'CNC Machine C5',      location: 'MFG Michigan', plannedThroughput: 120,  plannedUptimeHours: 16, totalDeviation: 38.4, aiSuggestedThroughput: 100,  selected: false },
  { id: 'res-4',  name: 'Injection Molder D3', location: 'MFG Michigan', plannedThroughput: 80,   plannedUptimeHours: 8,  totalDeviation: 35.2, aiSuggestedThroughput: 68,   selected: false },
  { id: 'res-5',  name: 'Packaging Line P1',   location: 'DC Louisiana', plannedThroughput: 600,  plannedUptimeHours: 8,  totalDeviation: 31.7, aiSuggestedThroughput: 480,  selected: false },
  { id: 'res-6',  name: 'Assembly Line A2',    location: 'MFG Mexico',   plannedThroughput: 240,  plannedUptimeHours: 8,  totalDeviation: 28.9, aiSuggestedThroughput: 200,  selected: false },
  { id: 'res-7',  name: 'Welding Station W2',  location: 'MFG Michigan', plannedThroughput: 55,   plannedUptimeHours: 8,  totalDeviation: 24.1, aiSuggestedThroughput: 48,   selected: false },
  { id: 'res-8',  name: 'Packaging Line P2',   location: 'DC Nebraska',  plannedThroughput: 550,  plannedUptimeHours: 8,  totalDeviation: 21.6, aiSuggestedThroughput: 470,  selected: false },
  { id: 'res-9',  name: 'Paint Booth PB1',     location: 'MFG Michigan', plannedThroughput: 40,   plannedUptimeHours: 8,  totalDeviation: 18.3, aiSuggestedThroughput: 37,   selected: false },
  { id: 'res-10', name: 'CNC Machine C8',      location: 'MFG Mexico',   plannedThroughput: 110,  plannedUptimeHours: 16, totalDeviation: 14.7, aiSuggestedThroughput: 102,  selected: false },
  { id: 'res-11', name: 'Warehouse Sorter S1', location: 'DC Louisiana', plannedThroughput: 1200, plannedUptimeHours: 16, totalDeviation: 11.2, aiSuggestedThroughput: 1100, selected: false },
  { id: 'res-12', name: 'Assembly Line B3',    location: 'MFG Mexico',   plannedThroughput: 260,  plannedUptimeHours: 8,  totalDeviation: 8.6,  aiSuggestedThroughput: 248,  selected: false },
  { id: 'res-13', name: 'Lathe Machine L4',    location: 'MFG Michigan', plannedThroughput: 90,   plannedUptimeHours: 8,  totalDeviation: 6.3,  aiSuggestedThroughput: 87,   selected: false },
  { id: 'res-14', name: 'Warehouse Sorter S2', location: 'DC Nebraska',  plannedThroughput: 1100, plannedUptimeHours: 16, totalDeviation: 4.1,  aiSuggestedThroughput: 1080, selected: false },
  { id: 'res-15', name: 'Packaging Line P3',   location: 'DC Nebraska',  plannedThroughput: 500,  plannedUptimeHours: 8,  totalDeviation: 2.8,  aiSuggestedThroughput: 498,  selected: false },
];

// Issue vs non-issue observation pools
const issueObsPool = [
  'Electricity supply fluctuations – 45 min downtime',
  'Machine starved for 2h (upstream bottleneck)',
  'Raw material rejection – Lot RMJ-4421 (dimensional OOT)',
  'Operator shortage (2nd shift understaffed)',
  'Tooling change – 1h setup',
  'Cooling system fault – 30 min repair',
  'Quality hold – 200 units scrapped',
  'Network outage impacted WMS-MES sync',
  'Upstream conveyance jam – 25 min',
  'Sensor calibration drift – manual check required',
];

const nonIssueObsPool = [
  'Line balanced run – optimal performance',
  'Scheduled preventive maintenance – 1.5h',
  'Scheduled line cleaning – 30 min',
  'Standard shift production – no incidents',
];

export const NON_ISSUE_OBSERVATIONS: ReadonlySet<string> = new Set(nonIssueObsPool);

const makeActualThroughputs = (resourceId: string, planned: number, plannedUptimeH: number, count: number): ActualThroughput[] => {
  return Array.from({ length: count }, (_, i) => {
    const isNonIssue = (i * 7 + 3) % 10 < 3; // ~30% non-issue rows
    const uptime = isNonIssue
      ? plannedUptimeH * (0.88 + ((i * 13 + 5) % 100) / 833)
      : plannedUptimeH * (0.55 + ((i * 17 + 7) % 100) / 278);
    const throughput = isNonIssue
      ? planned * (0.88 + ((i * 11 + 9) % 100) / 556)
      : planned * (0.50 + ((i * 19 + 3) % 100) / 222);
    const obsPool = isNonIssue ? nonIssueObsPool : issueObsPool;
    const numObs = isNonIssue ? 1 : 1 + (i % 3);
    const obs = Array.from({ length: numObs }, (_, j) => obsPool[(i * 3 + j) % obsPool.length]);
    const date = new Date(2026, 1, 1 + i * 2);
    return {
      id: `tp-${resourceId}-${i}`,
      resourceId,
      date: date.toISOString().split('T')[0],
      uptimeHours: parseFloat(uptime.toFixed(1)),
      throughput: Math.round(throughput),
      observations: [...new Set(obs)],
    };
  });
};

export const actualThroughputsMap: Record<string, ActualThroughput[]> = Object.fromEntries(
  resources.map(r => [r.id, makeActualThroughputs(r.id, r.plannedThroughput, r.plannedUptimeHours, 10)])
);

// ─── Demand Analysis ─────────────────────────────────────────────────────────────

// Helper to generate product hierarchy
function generateProductHierarchy(count: number): Product[] {
  const level1Categories: ProductCategory[] = ['Apparel', 'Footwear'];
  const level2Categories: Record<ProductCategory, string[]> = {
    Apparel: ["Men's Casual", "Women's Casual", "Men's Performance", "Women's Performance", "Kids"],
    Footwear: ["Men's Running", "Women's Running", "Men's Training", "Women's Training", "Kids"],
  };
  const level3Subcategories = [
    'T-Shirts', 'Polo Shirts', 'Shorts', 'Jackets', 'Pants',
    'Tanks', 'Sweatshirts', 'Hoodies', 'Compression', 'Baselayer',
  ];
  const level4Skus = [
    'Core', 'Pro', 'Elite', 'Lite', 'Max', 'Ultra', 'Basic', 'Premium', 'Plus', 'Nano',
  ];

  const products: Product[] = [];
  for (let i = 0; i < count; i++) {
    const l1 = level1Categories[i % 2];
    const l2List = level2Categories[l1];
    const l2 = l2List[i % l2List.length];
    const l3 = level3Subcategories[(i * 3) % level3Subcategories.length];
    const l4 = `SKU-${String(i + 1).padStart(4, '0')}-${level4Skus[i % level4Skus.length]}`;

    // Launch dates spread across 2020-2024, EOL dates spread across 2026-2028
    const launchYear = 2020 + (i % 5);
    const launchMonth = 1 + (i % 12);
    const launchDay = 1 + (i % 28);
    const eolYear = 2026 + ((i % 3));
    const eolMonth = 1 + ((i + 3) % 12);
    const eolDay = 1 + ((i + 7) % 28);

    products.push({
      id: `prod-${String(i + 1).padStart(4, '0')}`,
      level1: l1,
      level2: l2,
      level3: l3,
      level4: l4,
      launchDate: `${launchYear}-${String(launchMonth).padStart(2, '0')}-${String(launchDay).padStart(2, '0')}`,
      eolDate: `${eolYear}-${String(eolMonth).padStart(2, '0')}-${String(eolDay).padStart(2, '0')}`,
    });
  }
  return products;
}

export const productHierarchy: Product[] = generateProductHierarchy(200);

// Generate time series data (24 months: 2024-01 to 2025-12)
function generateTimeSeriesData(products: Product[]): TimeSeriesData[] {
  const data: TimeSeriesData[] = [];
  const months: string[] = [];
  for (let year = 2024; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      months.push(`${year}-${String(month).padStart(2, '0')}`);
    }
  }

  for (const product of products) {
    // Base sales vary by product
    const baseQty = 100 + (parseInt(product.id.split('-')[1]) % 500);
    const basePrice = 20 + ((parseInt(product.id.split('-')[1]) * 7) % 80);

    for (const month of months) {
      const monthNum = parseInt(month.split('-')[1]);
      // Seasonal variation (higher in months 5-8 for apparel, different for footwear)
      const seasonalFactor = product.level1 === 'Apparel'
        ? 0.8 + (monthNum >= 5 && monthNum <= 8 ? 0.5 : 0)
        : 0.9 + (monthNum >= 3 && monthNum <= 6 ? 0.3 : 0);

      // Varying volatility: 30% stable, 50% moderate, 20% high variance products
      const volatilityIndex = (parseInt(product.id.split('-')[1]) * 13) % 100;
      let randomFactorMin, randomFactorMax;
      if (volatilityIndex < 30) {
        randomFactorMin = 0.85; randomFactorMax = 1.15; // Stable: ±15%
      } else if (volatilityIndex < 80) {
        randomFactorMin = 0.6; randomFactorMax = 1.4;  // Moderate: ±40%
      } else {
        randomFactorMin = 0.3; randomFactorMax = 1.7;  // High: ±70%
      }
      const randomFactor = randomFactorMin + (Math.random() * (randomFactorMax - randomFactorMin));
      const salesQty = Math.round(baseQty * seasonalFactor * randomFactor);
      const salesVolume = salesQty * basePrice;

      // Forecasts with increasing error for higher lags
      const lag1Error = (Math.random() - 0.5) * 0.2; // ±10%
      const lag5Error = (Math.random() - 0.5) * 0.4; // ±20%
      const lag10Error = (Math.random() - 0.5) * 0.6; // ±30%
      const lag15Error = (Math.random() - 0.5) * 0.8; // ±40%

      const lag1 = Math.round(salesQty * (1 + lag1Error));
      const lag5 = Math.round(salesQty * (1 + lag5Error));
      const lag10 = Math.round(salesQty * (1 + lag10Error));
      const lag15 = Math.round(salesQty * (1 + lag15Error));

      data.push({
        productId: product.id,
        period: month,
        salesQty,
        salesVolume,
        forecasts: {
          lag1,
          lag5,
          lag10,
          lag15,
        },
      });
    }
  }
  return data;
}

export const timeSeriesData: TimeSeriesData[] = generateTimeSeriesData(productHierarchy);

// Default derived series configurations
export const defaultDerivedSeriesConfigs: DerivedSeriesConfig[] = [
  {
    id: 'adjusted-qty',
    name: 'Adjusted Quantity',
    formula: 'IF(salesQty < 10, 0, salesQty)',
    description: 'Zero out quantities below 10 for statistical significance',
  },
  {
    id: 'growth-rate',
    name: 'Growth Rate',
    formula: '(currentMonth.salesQty - prevMonth.salesQty) / prevMonth.salesQty',
    description: 'Month-over-month growth rate',
  },
];

// Default aggregate configurations
export const defaultAggregateConfigs: AggregateConfig[] = [
  {
    id: 'total-volume',
    name: 'Total Volume',
    formula: 'SUM(last_12_months.salesVolume)',
    description: 'Sum of sales volume over the last 12 months',
  },
  {
    id: 'total-quantity',
    name: 'Total Quantity',
    formula: 'SUM(last_12_months.salesQty)',
    description: 'Sum of sales quantity over the last 12 months',
  },
  {
    id: 'avg-lag1-error',
    name: 'Avg Lag 1 Error',
    formula: 'AVG(ABS(salesQty - forecasts.lag1) / salesQty)',
    description: 'Average absolute forecast error at lag 1',
  },
  {
    id: 'avg-lag5-error',
    name: 'Avg Lag 5 Error',
    formula: 'AVG(ABS(salesQty - forecasts.lag5) / salesQty)',
    description: 'Average absolute forecast error at lag 5',
  },
];

// Compute aggregates by hierarchy level
export function computeAggregatesByLevel(
  products: Product[],
  timeSeries: TimeSeriesData[],
  volumeType: 'quantity' | 'monetary',
  hierarchyLevel: 1 | 2 | 3 | 4
): ComputedAggregate[] {
  // Group products by hierarchy path at the specified level
  const groups = new Map<string, Product[]>();

  for (const product of products) {
    let path: string;
    if (hierarchyLevel === 1) {
      path = product.level1;
    } else if (hierarchyLevel === 2) {
      path = `${product.level1}/${product.level2}`;
    } else if (hierarchyLevel === 3) {
      path = `${product.level1}/${product.level2}/${product.level3}`;
    } else {
      path = `${product.level1}/${product.level2}/${product.level3}/${product.level4}`;
    }

    if (!groups.has(path)) {
      groups.set(path, []);
    }
    groups.get(path)!.push(product);
  }

  const computed: ComputedAggregate[] = [];

  for (const [path, groupProducts] of groups) {
    // Calculate volume total for the last 12 months
    let volumeTotal = 0;
    let qtyTotal = 0;
    let monthlyQuantities: number[] = [];
    let lag1Errors: number[] = [];
    let lag5Errors: number[] = [];

    for (const product of groupProducts) {
      const productData = timeSeries.filter(ts => ts.productId === product.id);
      // Get last 12 months of data
      const sortedData = productData.sort((a, b) => a.period.localeCompare(b.period));
      const last12 = sortedData.slice(-12);

      for (const month of last12) {
        volumeTotal += month.salesVolume;
        qtyTotal += month.salesQty;
        monthlyQuantities.push(month.salesQty);
        if (month.forecasts.lag1 !== null && month.salesQty > 0) {
          lag1Errors.push(Math.abs(month.salesQty - month.forecasts.lag1) / month.salesQty);
        }
        if (month.forecasts.lag5 !== null && month.salesQty > 0) {
          lag5Errors.push(Math.abs(month.salesQty - month.forecasts.lag5) / month.salesQty);
        }
      }
    }

    // Use quantity if volumeType is 'quantity', otherwise use monetary
    const volumeForABC = volumeType === 'quantity' ? qtyTotal : volumeTotal;

    // Calculate variance (coefficient of variation) for XYZ classification
    const meanQty = monthlyQuantities.length > 0
      ? monthlyQuantities.reduce((a, b) => a + b, 0) / monthlyQuantities.length
      : 0;
    const variance = meanQty > 0
      ? Math.sqrt(monthlyQuantities.reduce((sum, q) => sum + Math.pow(q - meanQty, 2), 0) / monthlyQuantities.length) / meanQty * 100
      : 0;

    // Calculate aggregate values
    const avgLag1Error = lag1Errors.length > 0
      ? lag1Errors.reduce((a, b) => a + b, 0) / lag1Errors.length * 100
      : 0;
    const avgLag5Error = lag5Errors.length > 0
      ? lag5Errors.reduce((a, b) => a + b, 0) / lag5Errors.length * 100
      : 0;

    computed.push({
      elementId: path.replace(/\//g, '-'),
      hierarchyPath: path,
      volumeTotal: volumeForABC,
      variancePercent: variance,
      abcClass: 'C', // Will be set after sorting
      xyzClass: variance <= 20 ? 'X' : variance <= 40 ? 'Y' : 'Z',
      aggregates: {
        'total-volume': volumeTotal,
        'total-quantity': qtyTotal,
        'avg-lag1-error': avgLag1Error,
        'avg-lag5-error': avgLag5Error,
      },
    });
  }

  // Sort by volume for ABC classification
  const sorted = computed.sort((a, b) => b.volumeTotal - a.volumeTotal);

  // Assign ABC classes (A: top 20%, B: next 40%, C: remaining 40%)
  const totalVolume = sorted.reduce((sum, item) => sum + item.volumeTotal, 0);
  let cumulativeVolume = 0;
  for (const item of sorted) {
    cumulativeVolume += item.volumeTotal;
    const cumulativePercent = cumulativeVolume / totalVolume;
    if (cumulativePercent <= 0.2) {
      item.abcClass = 'A';
    } else if (cumulativePercent <= 0.6) {
      item.abcClass = 'B';
    } else {
      item.abcClass = 'C';
    }
  }

  // Sort by hierarchy path for consistent display
  return computed.sort((a, b) => a.hierarchyPath.localeCompare(b.hierarchyPath));
}

// Pre-computed aggregates at level 4 (SKU level) for initial load
export const computedAggregatesLevel4: ComputedAggregate[] = computeAggregatesByLevel(
  productHierarchy,
  timeSeriesData,
  'monetary',
  4
);

// ─── Pre-loaded Questions ─────────────────────────────────────────────────────

export type PlaybookItem = {
  id: string;
  label: string;
} & (
  | { page: import('../types').PageId; tab?: 'lead-times' | 'throughput' | 'abc-xyz' | 'sunburst'; query?: never; action?: never }
  | { query: string; page?: never; tab?: never; action?: never }
  | { action: 'clear-history'; page?: never; query?: never; tab?: never }
);

export const preloadedQuestions: {
  category: string;
  icon: string;
  items: PlaybookItem[];
}[] = [
  {
    category: 'Short Term Planning Runs',
    icon: 'AlertTriangle',
    items: [
      { id: 'q-evaluate',  label: 'Evaluate latest planning execution', page: 'exception-analysis' },
      { id: 'q-summarize', label: "Summarize today's exceptions",        query: "Summarize today's exceptions" },
      { id: 'q-risk',      label: 'What is the total at-risk revenue?', query: 'What is the total at-risk revenue?' },
    ],
  },
  {
    category: 'Short Term Planning Config',
    icon: 'Sliders',
    items: [
      { id: 'q-lead-times',   label: 'Check lead times validity',                  page: 'planning-config', tab: 'lead-times' },
      { id: 'q-throughput',   label: 'Check throughput validity',                  page: 'planning-config', tab: 'throughput' },
      { id: 'q-lt-urgent',    label: 'Which lead times need urgent attention?',     query: 'Which lead times need urgent attention?' },
      { id: 'q-tp-mexico',    label: 'Throughput issues in MFG Mexico',            query: 'Show me throughput issues in MFG Mexico' },
      { id: 'q-accept',       label: 'Accept selected changes',                    query: 'Accept selected changes and update the planning system via MCP' },
    ],
  },
  {
    category: 'Demand Analysis',
    icon: 'BarChart3',
    items: [
      { id: 'q-demand-abc', label: 'Analyze ABC-XYZ classification', page: 'demand-analysis', tab: 'abc-xyz' },
      { id: 'q-demand-sunburst', label: 'View hierarchy breakdown', page: 'demand-analysis', tab: 'sunburst' },
      { id: 'q-demand-high-variability', query: 'Which products have high sales variability?' },
    ],
  },
  {
    category: 'Long Term Planning',
    icon: 'TrendingUp',
    items: [
      { id: 'q-longterm', label: 'Compare latest long term plan vs execution', page: 'long-term' },
    ],
  },
  {
    category: 'Chat',
    icon: 'MessageSquare',
    items: [
      { id: 'q-clear-history', label: 'Clear conversation history', action: 'clear-history' },
    ],
  },
];
