'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Criticality } from '@dbrs/shared';
import { useAnalytics } from '@/hooks/use-health';
import CardHeader, { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';

const CRITICALITY_COLORS: Record<Criticality, string> = {
  [Criticality.LOW]: '#64748b',
  [Criticality.MEDIUM]: '#6366f1',
  [Criticality.HIGH]: '#f59e0b',
  [Criticality.CRITICAL]: '#ef4444',
};

const tooltipStyle = {
  backgroundColor: '#1a1f2e',
  border: '1px solid #2d3548',
  borderRadius: '8px',
};

export interface AnalyticsChartsProps {
  days?: number;
}

export function AnalyticsCharts({ days = 30 }: AnalyticsChartsProps) {
  const { data, isLoading, isError, error } = useAnalytics(days);

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Failed to load analytics"
        description={error?.message ?? 'Unknown error'}
      />
    );
  }

  const criticalityData = data.criticalityDistribution.map((d) => ({
    name: d.criticality,
    value: d.count,
    fill: CRITICALITY_COLORS[d.criticality],
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Blast Radius Trend" description={`Last ${days} days`} />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.blastRadiusTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="totalImpacted" stroke="#818cf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader title="Severity Trend" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.severityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="severityScore" stroke="#fbbf24" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader title="Simulation Activity" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.simulationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader title="Criticality Distribution" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={criticalityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {criticalityData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Most Impacted Services" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.mostImpactedServices} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="serviceName" stroke="#94a3b8" fontSize={12} width={90} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="impactCount" fill="#fb7185" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Dependency Depth Distribution" />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dependencyDepthDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
              <XAxis dataKey="depth" stroke="#94a3b8" fontSize={12} label={{ value: 'Depth', position: 'insideBottom', offset: -5 }} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
