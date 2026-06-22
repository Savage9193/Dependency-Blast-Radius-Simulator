'use client';

import type { BlastRadiusResult } from '@dbrs/shared';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/utils';

export interface BlastRadiusResultsProps {
  result: BlastRadiusResult;
  serviceNames?: Record<string, string>;
}

export function BlastRadiusResults({ result, serviceNames = {} }: BlastRadiusResultsProps) {
  const getName = (id: string) => serviceNames[id] ?? id.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="sm">
          <p className="text-xs text-gray-500">Total Impacted</p>
          <p className="mt-1 text-2xl font-bold text-white">{formatNumber(result.totalImpacted)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500">Direct Impact</p>
          <p className="mt-1 text-2xl font-bold text-accent-amber">
            {formatNumber(result.summary.directCount)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500">Indirect Impact</p>
          <p className="mt-1 text-2xl font-bold text-accent-rose">
            {formatNumber(result.summary.indirectCount)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500">Max Depth</p>
          <p className="mt-1 text-2xl font-bold text-brand-hover">
            {formatNumber(result.summary.maxDepth)}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Failed Services" description="Root failure points" />
          <div className="flex flex-wrap gap-2">
            {result.failedServices.map((id) => (
              <Badge key={id} variant="danger">
                {getName(id)}
              </Badge>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Directly Impacted" />
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {result.directlyImpacted.length === 0 ? (
              <p className="text-sm text-gray-500">None</p>
            ) : (
              result.directlyImpacted.map((id) => (
                <div key={id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{getName(id)}</span>
                  <Badge variant="warning">Depth {result.impactDepths[id] ?? 1}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Indirectly Impacted" />
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {result.indirectlyImpacted.length === 0 ? (
              <p className="text-sm text-gray-500">None</p>
            ) : (
              result.indirectlyImpacted.map((id) => (
                <div key={id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{getName(id)}</span>
                  <Badge variant="default">Depth {result.impactDepths[id] ?? '?'}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
