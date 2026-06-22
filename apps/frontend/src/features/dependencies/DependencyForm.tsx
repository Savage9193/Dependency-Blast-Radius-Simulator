'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDependencySchema, type CreateDependencyInput } from '@dbrs/shared';
import { useServices } from '@/hooks/use-services';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export interface DependencyFormProps {
  onSubmit: (data: CreateDependencyInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DependencyForm({ onSubmit, onCancel, loading }: DependencyFormProps) {
  const { data: servicesData } = useServices({ limit: 100 });
  const services = servicesData?.data ?? [];

  const serviceOptions = services.map((s) => ({ value: s.id, label: s.name }));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDependencyInput>({
    resolver: zodResolver(createDependencySchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Source Service (depends on)"
        options={serviceOptions}
        placeholder="Select source service"
        {...register('sourceServiceId')}
        error={errors.sourceServiceId?.message}
      />
      <Select
        label="Target Service (dependency)"
        options={serviceOptions}
        placeholder="Select target service"
        {...register('targetServiceId')}
        error={errors.targetServiceId?.message}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create Dependency
        </Button>
      </div>
    </form>
  );
}
