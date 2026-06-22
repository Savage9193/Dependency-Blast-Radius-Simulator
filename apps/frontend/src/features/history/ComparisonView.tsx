'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useCompareSimulations } from '@/hooks/use-simulations';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { formatNumber } from '@/lib/utils';

export interface ComparisonViewProps {
  simulationIds: string[];
  onClose: () => void;
}

export function ComparisonView({ simulationIds, onClose }: ComparisonViewProps) {
  const { mutate, data: comparison, isPending, isError, error } = useCompareSimulations();

  useEffect(() => {
    mutate(simulationIds);
  }, [simulationIds, mutate]);

  return (
    <Modal
      open
      onClose={onClose}
      title="Simulation Comparison"
      description={`Comparing ${simulationIds.length} simulations`}
      size="xl"
      footer={
        <Button variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
          Close
        </Button>
      }
    >
      {isPending && <SkeletonCard />}
      {isError && (
        <p className="text-sm text-accent-rose">{error?.message}</p>
      )}
      {comparison && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comparison.simulations.map((sim) => (
              <Card key={sim.id} padding="sm">
                <p className="font-medium text-white">{sim.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="warning">{formatNumber(sim.totalImpacted)} impacted</Badge>
                  <Badge variant="brand">Score: {sim.severityScore.toFixed(1)}</Badge>
                </div>
              </Card>
            ))}
          </div>

          <Card padding="sm">
            <CardHeader title="Common Failed Services" />
            {comparison.commonFailedServices.length === 0 ? (
              <p className="text-sm text-gray-500">No common failed services</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {comparison.commonFailedServices.map((id) => (
                  <Badge key={id} variant="danger">
                    {id.slice(0, 8)}...
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <Card padding="sm">
            <CardHeader title="Severity Deltas" />
            <div className="space-y-2">
              {Object.entries(comparison.severityDelta).map(([key, delta]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{key.replace('_vs_', ' vs ')}</span>
                  <Badge variant={delta > 0 ? 'danger' : delta < 0 ? 'success' : 'default'}>
                    {delta > 0 ? '+' : ''}
                    {delta.toFixed(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="sm">
            <CardHeader title="Unique Impacts per Simulation" />
            <div className="space-y-4">
              {Object.entries(comparison.uniqueImpacts).map(([simId, serviceIds]) => {
                const sim = comparison.simulations.find((s) => s.id === simId);
                return (
                  <div key={simId}>
                    <p className="text-sm font-medium text-white">{sim?.name ?? simId}</p>
                    <p className="mt-1 text-xs text-gray-500">{serviceIds.length} impacted services</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
}
