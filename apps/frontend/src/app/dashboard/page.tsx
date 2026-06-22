'use client';

import { Activity, Server, GitBranch, PlayCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useHealthDashboard } from '@/hooks/use-health';
import CardHeader, { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { formatDate, formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useHealthDashboard();

  return (
    <AppShell
      title="Dashboard"
      description="Overview of your service dependency landscape"
    >
      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load dashboard"
          description={error.message}
        />
      )}

      {data && (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand/20 p-2">
                  <Server className="h-5 w-5 text-brand-hover" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Services</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(data.totalServices)}</p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent-emerald/20 p-2">
                  <Activity className="h-5 w-5 text-accent-emerald" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Healthy</p>
                  <p className="text-2xl font-bold text-accent-emerald">
                    {formatNumber(data.healthyServices)}
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand/20 p-2">
                  <GitBranch className="h-5 w-5 text-brand-hover" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dependencies</p>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(data.totalDependencies)}
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent-amber/20 p-2">
                  <PlayCircle className="h-5 w-5 text-accent-amber" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Simulations</p>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(data.simulationsCount)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Service Health" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Healthy</span>
                  <Badge variant="success">{data.healthyServices}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Degraded</span>
                  <Badge variant="warning">{data.degradedServices}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Failed</span>
                  <Badge variant="danger">{data.failedServices}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Critical Services</span>
                  <Badge variant="critical">{data.criticalServices}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Avg Dependency Depth</span>
                  <span className="text-sm text-white">{data.averageDependencyDepth.toFixed(1)}</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Most Connected Services"
                action={
                  <Link href="/dependencies">
                    <Button variant="ghost" size="sm">
                      View Graph
                    </Button>
                  </Link>
                }
              />
              <div className="space-y-3">
                {data.mostConnectedServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{service.name}</span>
                    <Badge variant="brand">{service.connectionCount} connections</Badge>
                  </div>
                ))}
                {data.mostConnectedServices.length === 0 && (
                  <p className="text-sm text-gray-500">No services yet</p>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Recent Simulations"
              action={
                <Link href="/history">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              }
            />
            {data.recentSimulations.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No simulations yet</p>
                <Link href="/simulations">
                  <Button className="mt-4" size="sm">
                    Run Simulation
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Impacted</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentSimulations.map((sim) => (
                    <TableRow key={sim.id}>
                      <TableCell className="font-medium text-white">{sim.name}</TableCell>
                      <TableCell>{formatNumber(sim.totalImpacted)}</TableCell>
                      <TableCell>
                        <Badge variant="warning">{sim.metadata.severityClassification}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(sim.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
