'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createServiceSchema, type CreateServiceInput, Criticality, ServiceStatus } from '@dbrs/shared';
import type { Service } from '@dbrs/shared';
import { Input } from '@/components/ui/Input';
import Select  from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const criticalityOptions = Object.values(Criticality).map((v) => ({
  value: v,
  label: v.charAt(0) + v.slice(1).toLowerCase(),
}));

const statusOptions = Object.values(ServiceStatus).map((v) => ({
  value: v,
  label: v.charAt(0) + v.slice(1).toLowerCase(),
}));

export interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: CreateServiceInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ServiceForm({ service, onSubmit, onCancel, loading }: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      owner: service?.owner ?? '',
      team: service?.team ?? '',
      criticality: service?.criticality ?? Criticality.MEDIUM,
      status: service?.status ?? ServiceStatus.HEALTHY,
    },
  });

  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        description: service.description,
        owner: service.owner,
        team: service.team,
        criticality: service.criticality,
        status: service.status,
      });
    }
  }, [service, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Name"
        {...register('name')}
        error={errors.name?.message}
        placeholder="payment-api"
      />
      <Input
        label="Description"
        {...register('description')}
        error={errors.description?.message}
        placeholder="Handles payment processing"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Owner" {...register('owner')} error={errors.owner?.message} />
        <Input label="Team" {...register('team')} error={errors.team?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Criticality"
          options={criticalityOptions}
          {...register('criticality')}
          error={errors.criticality?.message}
        />
        <Select
          label="Status"
          options={statusOptions}
          {...register('status')}
          error={errors.status?.message}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {service ? 'Update Service' : 'Create Service'}
        </Button>
      </div>
    </form>
  );
}
