'use client';

import { AppShell } from '@/components/layout/AppShell';
import { SimulationRunner } from '@/features/simulations/SimulationRunner';

export default function SimulationsPage() {
  return (
    <AppShell
      title="Simulations"
      description="Simulate service failures and analyze blast radius impact"
    >
      <SimulationRunner />
    </AppShell>
  );
}
