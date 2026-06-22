'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSimulationSchema, type CreateSimulationInput } from '@dbrs/shared';
import { PlayCircle } from 'lucide-react';
import { useServices } from '@/hooks/use-services';
import { useRunSimulation } from '@/hooks/use-simulations';
import type { SimulationRunResponse } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import CardHeader, { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { BlastRadiusResults } from './BlastRadiusResults';
import { ImpactVisualization } from './ImpactVisualization';

export function SimulationRunner() {
  const [result, setResult] = useState<SimulationRunResponse | null>(null);
  const { data: servicesData } = useServices({ limit: 100 });
  const runMutation = useRunSimulation();
  const services = servicesData?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSimulationInput>({
    resolver: zodResolver(createSimulationSchema),
    defaultValues: { name: '', failedServiceIds: [] },
  });

  const selectedIds = watch('failedServiceIds') ?? [];

  const toggleService = (id: string) => {
    const current = selectedIds;
    setValue(
      'failedServiceIds',
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      { shouldValidate: true },
    );
  };

  const serviceNames = Object.fromEntries(services.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader
          title="Run Simulation"
          description="Select services to simulate as failed and analyze blast radius impact"
        />
        <form
          onSubmit={handleSubmit((data) =>
            runMutation.mutate(data, { onSuccess: (res) => setResult(res) }),
          )}
          className="space-y-6"
        >
          <Input
            label="Simulation Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Production outage scenario"
          />

          <div>
            <p className="mb-3 text-sm font-medium text-gray-300">
              Failed Services ({selectedIds.length} selected)
            </p>
            {errors.failedServiceIds && (
              <p className="mb-2 text-xs text-accent-rose">{errors.failedServiceIds.message}</p>
            )}
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-surface-border bg-surface p-4">
              {services.map((service) => {
                const selected = selectedIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? 'border-accent-rose/50 bg-accent-rose/20 text-accent-rose'
                        : 'border-surface-border text-gray-400 hover:border-brand/50 hover:text-white'
                    }`}
                  >
                    {service.name}
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" loading={runMutation.isPending} size="lg">
            <PlayCircle className="h-5 w-5" />
            Run Simulation
          </Button>
        </form>
      </Card>

      {result && (
        <div className="animate-fade-in space-y-8">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">{result.simulation.name}</h2>
            <Badge variant="brand">Severity: {result.severity.classification}</Badge>
            <Badge variant="warning">Score: {result.severity.score.toFixed(1)}</Badge>
          </div>
          <ImpactVisualization blastResult={result.blastResult} severity={result.severity} />
          <BlastRadiusResults result={result.blastResult} serviceNames={serviceNames} />
        </div>
      )}
    </div>
  );
}
