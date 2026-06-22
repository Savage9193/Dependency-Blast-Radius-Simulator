'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AnalyticsCharts } from '@/features/analytics/AnalyticsCharts';
import Select from '@/components/ui/Select';

const dayOptions = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  return (
    <AppShell title="Analytics" description="Trends and insights from simulation data">
      <div className="mb-6 max-w-xs">
        <Select
          label="Time Range"
          options={dayOptions}
          value={String(days)}
          onChange={(e) => setDays(Number(e.target.value))}
        />
      </div>
      <AnalyticsCharts days={days} />
    </AppShell>
  );
}
