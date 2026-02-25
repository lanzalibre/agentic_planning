import { AppProvider, useApp } from './context/AppContext';
import { RightNavbar } from './components/layout/RightNavbar';
import { BottomQueryBox } from './components/layout/BottomQueryBox';
import { Overview } from './pages/Overview';
import { Connections } from './pages/Connections';
import { ExceptionAnalysis } from './pages/ExceptionAnalysis';
import { LeadTimesValidation } from './pages/LeadTimesValidation';
import { ThroughputValidation } from './pages/ThroughputValidation';
import { LongTermPlanning } from './pages/LongTermPlanning';
import { PlanningConfiguration } from './pages/PlanningConfiguration';
import { DemandAnalysis } from './pages/DemandAnalysis';

function AppShell() {
  const { currentPage } = useApp();

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':          return <Overview />;
      case 'connections':       return <Connections />;
      case 'exception-analysis': return <ExceptionAnalysis />;
      case 'planning-config':   return <PlanningConfiguration />;
      case 'lead-times':        return <LeadTimesValidation />;
      case 'throughput':        return <ThroughputValidation />;
      case 'demand-analysis':   return <DemandAnalysis />;
      case 'long-term':         return <LongTermPlanning />;
      default:                  return <Overview />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Page content */}
        <div className="flex-1 overflow-y-auto pb-40">
          {renderPage()}
        </div>

        {/* Bottom Query Box — always visible */}
        <BottomQueryBox />
      </div>

      {/* Right Navbar */}
      <RightNavbar />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
