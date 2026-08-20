import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { DataProvider } from './contexts/DataContext';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { SmartIntake } from './pages/SmartIntake';
import { McdmEngine } from './pages/McdmEngine';
import { PortfolioOptimizer } from './pages/PortfolioOptimizer';
import { JusticeMap } from './pages/JusticeMap';
import { ReportingCenter } from './pages/ReportingCenter';

export function App() {
  return (
    <AppProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/intake" element={<SmartIntake />} />
              <Route path="/mcdm" element={<McdmEngine />} />
              <Route path="/optimizer" element={<PortfolioOptimizer />} />
              <Route path="/map" element={<JusticeMap />} />
              <Route path="/reports" element={<ReportingCenter />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AppProvider>);

}
