'use client';

import { useState } from 'react';
import { History, RotateCcw, GitCompare } from 'lucide-react';
import { useSimulations, useRerunSimulation } from '@/hooks/use-simulations';
import { useUiStore } from '@/store/ui-store';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ComparisonView } from './ComparisonView';
import { formatDate, formatNumber } from '@/lib/utils';

const severityVariant: Record<string, 'default' | 'warning' | 'danger' | 'critical'> = {
  LOW: 'default',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'critical',
};

export function SimulationHistory() {
  const [page, setPage] = useState(1);
  const [compareOpen, setCompareOpen] = useState(false);
  const selectedIds = useUiStore((s) => s.selectedSimulationIds);
  const toggleSelection = useUiStore((s) => s.toggleSimulationSelection);
  const clearSelection = useUiStore((s) => s.clearSimulationSelection);

  const { data, isLoading, isError, error } = useSimulations(page, 20);
  const rerunMutation = useRerunSimulation();

  if (isLoading) return <SkeletonCard />;
  if (isError) {
    return (
      <EmptyState icon={History} title="Failed to load history" description={error.message} />
    );
  }

  const simulations = data?.data ?? [];

  return (
    <div className="space-y-6">
      {selectedIds.length >= 2 && (
        <div className="flex items-center justify-between rounded-xl border border-brand/30 bg-brand/10 px-4 py-3">
          <p className="text-sm text-brand-hover">
            {selectedIds.length} simulations selected for comparison
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
            <Button size="sm" onClick={() => setCompareOpen(true)}>
              <GitCompare className="h-4 w-4" />
              Compare
            </Button>
          </div>
        </div>
      )}

      {simulations.length === 0 ? (
        <EmptyState
          icon={History}
          title="No simulation history"
          description="Run a simulation to see results here."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <span className="sr-only">Select</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Impacted</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {simulations.map((sim) => (
                <TableRow key={sim.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(sim.id)}
                      onChange={() => toggleSelection(sim.id)}
                      className="h-4 w-4 rounded border-surface-border bg-surface-raised text-brand focus:ring-brand"
                      aria-label={`Select ${sim.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-white">{sim.name}</p>
                    <p className="text-xs text-gray-500">
                      {sim.metadata.failedServiceNames?.join(', ') ?? `${sim.failedServices.length} services`}
                    </p>
                  </TableCell>
                  <TableCell>{formatNumber(sim.totalImpacted)}</TableCell>
                  <TableCell>
                    <Badge variant={severityVariant[sim.metadata.severityClassification] ?? 'default'}>
                      {sim.metadata.severityClassification}
                    </Badge>
                  </TableCell>
                  <TableCell>{sim.severityScore.toFixed(1)}</TableCell>
                  <TableCell>{formatDate(sim.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={rerunMutation.isPending}
                      onClick={() => rerunMutation.mutate(sim.id)}
                      aria-label={`Rerun ${sim.name}`}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data?.pagination && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {compareOpen && selectedIds.length >= 2 && (
        <ComparisonView
          simulationIds={selectedIds}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  );
}
