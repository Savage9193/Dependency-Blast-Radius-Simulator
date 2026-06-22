'use client';

import { AppShell } from '@/components/layout/AppShell';
import { DependencyGraph } from '@/features/dependencies/DependencyGraph';

export default function DependenciesPage() {
  return (
    <AppShell
      title="Dependencies"
      description="Visualize and manage service dependency relationships"
    >
      <DependencyGraph />
    </AppShell>
  );
}
