import React, { createContext, useContext, useState, useCallback } from 'react';
import type { KPIWidget, PageId, QueryMessage, DemandAnalysisTab } from '../types';
import { defaultKPIWidgets } from '../data/mockData';

interface AppContextValue {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  kpiWidgets: KPIWidget[];
  setKpiWidgets: (widgets: KPIWidget[]) => void;
  queryMessages: QueryMessage[];
  addQuery: (text: string) => void;
  clearHistory: () => void;
  planningConfigTab: 'lead-times' | 'throughput';
  setPlanningConfigTab: (tab: 'lead-times' | 'throughput') => void;
  demandAnalysisTab: DemandAnalysisTab;
  setDemandAnalysisTab: (tab: DemandAnalysisTab) => void;
  pendingMention: string | null;
  appendMention: (mention: string) => void;
  clearMention: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const aiResponses: Record<string, string> = {
  default: "I'm analyzing your supply chain data. Based on the latest planning run, I can see 520 exceptions across 3 main categories. Would you like me to break down the root causes or suggest an action plan?",
  lead: "Based on the last 4 weeks of shipment data, I've identified 23 lane/mode combinations where actual lead times deviate >30% from planning system parameters. The most critical is MFG Mexico → DC Louisiana (truck) at +47% deviation. I recommend updating the planning system with the AI-suggested values.",
  throughput: "Throughput analysis shows Assembly Line A1 in MFG Mexico is running at 77% of planned capacity due to recurring electricity supply issues and upstream starvation. AI suggests updating the planned throughput from 240 to 185 units/h until the root cause is resolved.",
  exception: "The latest planning run (Feb 24, 2026, 02:00 AM) generated 520 exceptions. I've grouped them into 3 categories: Material Not Available, Material Available at Alternate Location, and Orders Stuck at Warehouse. Total at-risk value calculated from all exceptions.",
  accept: "I've submitted the selected planning parameter updates to Blue Yonder APO via MCP. All changes have been applied — the planning system will reflect the new values in the next planning run scheduled for tonight at 02:00 AM.",
  summarize: "Summary for Feb 24, 2026: 520 exceptions detected across 3 groups. Highest risk: Material Not Available (Electronics) with the largest monetary exposure. 23 lead time lanes deviate >30% from plan — most critical is MFG Mexico → DC Louisiana at +47%. 5 resources show >30% throughput deviation.",
  risk: "Total at-risk revenue across all 520 exceptions is approximately $8.6M. Breakdown: Material Not Available ~$4.8M, Alternate Location ~$2.1M, Warehouse Stuck ~$1.7M. Highest single SKU exposure: Electronics/Pro/XYZ-5.",
  urgentLT: "Most urgent lead time lanes (>30% deviation): MFG Mexico → DC Louisiana (+47%), MFG Michigan → DC Nebraska (+38%), Supplier CN → MFG Mexico (+36%). I recommend selecting these 3 lanes and submitting updated parameters to Blue Yonder APO immediately.",
  throughputMX: "MFG Mexico throughput issues: Assembly Line A1 at −23% vs plan (electricity fluctuations), Assembly Line B2 at −19% (upstream starvation), CNC Machine C8 at −8% (tooling change). Assembly Line A1 is the most critical — AI suggests reducing planned throughput from 240 to 185 u/h.",
  demandABC: "ABC-XYZ analysis shows 45 products classified as AX (high value, low variance), 38 as BY, and 22 as CZ (low value, high variability). Top AX products contribute to 22% of total revenue. I recommend focusing forecast improvement efforts on BY products where you can get the best ROI.",
  demandHighVariance: "High sales variability products (Z-class with >40% variance): 67 products across all categories. Top contributors: Footwear/Men's Running/Sneakers (8 SKUs), Apparel/Kids/T-Shirts (6 SKUs). These products require more frequent forecasting cycles and potentially different inventory strategies (e.g., safety stock buffers).",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [kpiWidgets, setKpiWidgets] = useState<KPIWidget[]>(defaultKPIWidgets);
  const [planningConfigTab, setPlanningConfigTab] = useState<'lead-times' | 'throughput'>('lead-times');
  const [demandAnalysisTab, setDemandAnalysisTab] = useState<DemandAnalysisTab>('abc-xyz');
  const [pendingMention, setPendingMention] = useState<string | null>(null);
  const [queryMessages, setQueryMessages] = useState<QueryMessage[]>([
    {
      id: 'welcome',
      text: "Hello! I'm your AI supply chain planning assistant. I can analyze exceptions, review lead times, check throughput validity, and help you take corrective actions. What would you like to explore today?",
      type: 'assistant',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);

  const addQuery = useCallback((text: string) => {
    const userMsg: QueryMessage = {
      id: `q-${Date.now()}`,
      text,
      type: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };

    const lower = text.toLowerCase();
    let response = aiResponses.default;
    if (lower.includes('accept selected') || lower.includes('submit') && lower.includes('mcp')) response = aiResponses.accept;
    else if (lower.includes('summarize') && lower.includes('exception')) response = aiResponses.summarize;
    else if (lower.includes('at-risk revenue') || lower.includes('at risk revenue')) response = aiResponses.risk;
    else if (lower.includes('lead time') && lower.includes('urgent')) response = aiResponses.urgentLT;
    else if (lower.includes('throughput') && lower.includes('mfg mexico')) response = aiResponses.throughputMX;
    else if (lower.includes('lead time') || lower.includes('lead-time') || lower.includes('@lt:')) response = aiResponses.lead;
    else if (lower.includes('throughput') || lower.includes('capacity') || lower.includes('resource') || lower.includes('@resource:')) response = aiResponses.throughput;
    else if (lower.includes('exception') || lower.includes('planning run') || lower.includes('@product:')) response = aiResponses.exception;
    else if (lower.includes('abc-xyz') || lower.includes('abc xyz')) response = aiResponses.demandABC;
    else if (lower.includes('high sales variability') || lower.includes('high variability')) response = aiResponses.demandHighVariance;

    const aiMsg: QueryMessage = {
      id: `a-${Date.now()}`,
      text: response,
      type: 'assistant',
      timestamp: new Date().toLocaleTimeString(),
    };

    setQueryMessages(prev => [...prev, userMsg, aiMsg]);
  }, []);

  const appendMention = useCallback((mention: string) => {
    setPendingMention(mention);
  }, []);

  const clearMention = useCallback(() => {
    setPendingMention(null);
  }, []);

  const welcomeMsg: QueryMessage = {
    id: 'welcome',
    text: "Hello! I'm your AI supply chain planning assistant. I can analyze exceptions, review lead times, check throughput validity, and help you take corrective actions. What would you like to explore today?",
    type: 'assistant',
    timestamp: new Date().toLocaleTimeString(),
  };

  const clearHistory = useCallback(() => {
    setQueryMessages([{ ...welcomeMsg, timestamp: new Date().toLocaleTimeString() }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage,
      kpiWidgets, setKpiWidgets,
      queryMessages, addQuery, clearHistory,
      planningConfigTab, setPlanningConfigTab,
      demandAnalysisTab, setDemandAnalysisTab,
      pendingMention, appendMention, clearMention,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
