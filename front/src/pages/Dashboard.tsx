import React from 'react';
import { KpiCards } from '../components/dashboard/KpiCards';
import { ValueScatter } from '../components/dashboard/ValueScatter';
import { CriticalProjects } from '../components/dashboard/CriticalProjects';
import { AiSummaryCard } from '../components/dashboard/AiSummaryCard';
import { DecisionHistory } from '../components/dashboard/DecisionHistory';

export function Dashboard() {
  return (
    <div className="space-y-8">
      <KpiCards />

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <ValueScatter />
        <CriticalProjects />
      </div>

      <AiSummaryCard />
      <DecisionHistory />
    </div>);

}