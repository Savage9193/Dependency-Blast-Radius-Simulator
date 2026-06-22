'use client';

import { useState } from 'react';
import { Criticality, ServiceStatus } from '@dbrs/shared';
import type { ServiceFilterInput } from '@dbrs/shared';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const criticalityOptions = Object.values(Criticality).map((v) => ({
  value: v,
  label: v.charAt(0) + v.slice(1).toLowerCase(),
}));

const statusOptions = Object.values(ServiceStatus).map((v) => ({
  value: v,
  label: v.charAt(0) + v.slice(1).toLowerCase(),
}));

export interface ServiceFiltersProps {
  filters: Partial<ServiceFilterInput>;
  onChange: (filters: Partial<ServiceFilterInput>) => void;
  className?: string;
}

export function ServiceFilters({ filters, onChange, className }: ServiceFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = (key: keyof ServiceFilterInput, value: string) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search services..."
            value={filters.search ?? ''}
            onChange={(e) => update('search', e.target.value)}
            className="pl-10"
            aria-label="Search services"
          />
        </div>
        <Button variant="outline" onClick={() => setExpanded(!expanded)}>
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {expanded && (
        <div className="grid gap-4 rounded-xl border border-surface-border bg-surface-raised p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Owner"
            value={filters.owner ?? ''}
            onChange={(e) => update('owner', e.target.value)}
          />
          <Input
            label="Team"
            value={filters.team ?? ''}
            onChange={(e) => update('team', e.target.value)}
          />
          <Select
            label="Criticality"
            options={[{ value: '', label: 'All' }, ...criticalityOptions]}
            value={filters.criticality ?? ''}
            onChange={(e) => update('criticality', e.target.value)}
          />
          <Select
            label="Status"
            options={[{ value: '', label: 'All' }, ...statusOptions]}
            value={filters.status ?? ''}
            onChange={(e) => update('status', e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
