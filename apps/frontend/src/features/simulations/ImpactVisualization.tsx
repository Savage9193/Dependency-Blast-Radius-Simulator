'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { BlastRadiusResult, SeverityResult } from '@dbrs/shared';
import { SeverityClassification } from '@dbrs/shared';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const severityColors: Record<SeverityClassification, string> = {
  [SeverityClassification.LOW]: '#64748b',
  [SeverityClassification.MEDIUM]: '#6366f1',
  [SeverityClassification.HIGH]: '#f59e0b',
  [SeverityClassification.CRITICAL]: '#ef4444',
};

export interface ImpactVisualizationProps {
  blastResult: BlastRadiusResult;
  severity: SeverityResult;
}

export function ImpactVisualization({ blastResult, severity }: ImpactVisualizationProps) {
  const chartData = [
    { name: 'Direct', value: blastResult.summary.directCount, fill: '#fbbf24' },
    { name: 'Indirect', value: blastResult.summary.indirectCount, fill: '#fb7185' },
    { name: 'Failed', value: blastResult.failedServices.length, fill: '#ef4444' },
  ];

  const breakdownData = [
    { name: 'Affected', value: severity.breakdown.affectedScore },
    { name: 'Depth', value: severity.breakdown.depthScore },
    { name: 'Criticality', value: severity.breakdown.criticalityScore },
    { name: 'Root', value: severity.breakdown.rootScore },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="Impact Distribution"
          action={
            <Badge variant="brand">
              Score: {severity.score.toFixed(1)} ({severity.classification})
            </Badge>
          }
        />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid #2d3548',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader title="Severity Breakdown" />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdownData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid #2d3548',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={severityColors[severity.classification]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
