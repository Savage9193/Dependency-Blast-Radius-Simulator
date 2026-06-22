'use client';

import { AppShell } from '@/components/layout/AppShell';
import { SimulationHistory } from '@/features/history/SimulationHistory';

export default function HistoryPage() {
  return (
    <AppShell title="History" description="View and compare past simulation runs">
      <SimulationHistory />
    </AppShell>
  );
}
