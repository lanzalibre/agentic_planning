// ─── KPI Widgets ────────────────────────────────────────────────────────────

export interface KPIWidget {
  id: string;
  title: string;
  value: number;
  unit?: string;
  visible: boolean;
  color: 'red' | 'amber' | 'blue' | 'green' | 'purple';
  icon: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: number;
  description: string;
}

// ─── Connections ─────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface Connection {
  id: string;
  category: string;
  name: string;
  vendor: string;
  status: ConnectionStatus;
  host?: string;
  port?: string;
  description: string;
  lastSync?: string;
}

// ─── Exception Analysis ───────────────────────────────────────────────────────

export type Channel = 'online' | 'in-store' | 'wholesale';

export interface PlanningException {
  id: string;
  productHierarchy: string;
  channel: Channel;
  periodFrom: string;
  periodTo: string;
  quantity: number;
  monetaryValue: number;
  sku: string;
}

export type GroupAction = 'notify_delay' | 'expedite' | 'reallocate' | 'cancel' | 'split_order' | null;

export interface ExceptionGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  totalValue: number;
  totalQty: number;
  exceptions: PlanningException[];
  suggestedAction: string;
  suggestedActionDetail: string;
  actionType: GroupAction;
  selfHealingCategory: string;
  accepted?: boolean;
}

export type SelfHealingRule = {
  id: string;
  trigger: string;
  condition: string;
  action: string;
  confidence: number;
  timesApplied: number;
};

// ─── Lead Times ───────────────────────────────────────────────────────────────

export type TransportMode = 'boat' | 'air' | 'truck' | 'rail';

export interface LeadTime {
  id: string;
  fromLocation: string;
  toLocation: string;
  transport: TransportMode;
  plannedDays: number;
  avgDeviation: number;
  totalDeviation: number;
  aiSuggestedDays: number;
  selected: boolean;
}

export interface ActualLeadTime {
  id: string;
  leadTimeId: string;
  shipmentRef: string;
  pickupDate: string;
  dropoffDate: string;
  actualDays: number;
  deltaVsPlanned: number;
}

// ─── Throughput ───────────────────────────────────────────────────────────────

export interface Resource {
  id: string;
  name: string;
  location: string;
  plannedThroughput: number;
  plannedUptimeHours: number;
  totalDeviation: number;
  aiSuggestedThroughput: number;
  selected: boolean;
}

export interface ActualThroughput {
  id: string;
  resourceId: string;
  date: string;
  uptimeHours: number;
  throughput: number;
  observations: string[];
}

// ─── App State ────────────────────────────────────────────────────────────────

export type PageId =
  | 'overview'
  | 'connections'
  | 'exception-analysis'
  | 'planning-config'
  | 'lead-times'
  | 'throughput'
  | 'demand-analysis'
  | 'long-term';

export interface QueryMessage {
  id: string;
  text: string;
  type: 'user' | 'assistant';
  timestamp: string;
}

// ─── Demand Analysis ─────────────────────────────────────────────────────────────

export type ProductCategory = 'Apparel' | 'Footwear';

export interface Product {
  id: string;
  level1: ProductCategory;
  level2: string;  // Category (e.g., "Men's Casual", "Women's Running")
  level3: string;  // Subcategory (e.g., "T-Shirts", "Sneakers")
  level4: string;  // SKU
  launchDate: string;  // YYYY-MM-DD
  eolDate: string;     // YYYY-MM-DD
}

export type VolumeType = 'quantity' | 'monetary';
export type ForecastLag = 'lag1' | 'lag5' | 'lag10' | 'lag15';

export interface TimeSeriesData {
  productId: string;
  period: string;  // YYYY-MM (monthly)
  salesQty: number;
  salesVolume: number;
  forecasts: Record<ForecastLag, number | null>;  // Actual forecast values
}

export interface DerivedSeriesConfig {
  id: string;
  name: string;
  formula: string;  // e.g., "IF(salesQty < 10, 0, salesQty)"
  description: string;
}

export interface AggregateConfig {
  id: string;
  name: string;
  formula: string;  // e.g., "SUM(last_12_months.salesVolume)"
  description: string;
}

export interface ComputedAggregate {
  elementId: string;
  hierarchyPath: string;  // e.g., "Apparel/Men's Casual/T-Shirts/SKU-001"
  volumeTotal: number;    // Sales volume (quantity or monetary)
  variancePercent: number; // Sales variance for XYZ classification
  abcClass: 'A' | 'B' | 'C';
  xyzClass: 'X' | 'Y' | 'Z';
  aggregates: Record<string, number>;  // All configured aggregates
}

export type DemandAnalysisTab = 'abc-xyz' | 'sunburst';
export type HierarchyLevel = 1 | 2 | 3 | 4;
export type TimeSeriesAggregate = 'volume' | 'quantity' | 'lag1_error' | 'lag5_error' | 'lag1_error_pct';
