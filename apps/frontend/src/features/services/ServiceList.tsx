'use client';

import { useState } from 'react';
import type { ServiceFilterInput } from '@dbrs/shared';
import type { ServiceWithCounts } from '@dbrs/shared';
import { Plus, Pencil, Trash2, Server } from 'lucide-react';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/use-services';
import { ServiceFilters } from './ServiceFilters';
import { ServiceForm } from './ServiceForm';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

const criticalityVariant: Record<string, 'default' | 'warning' | 'danger' | 'critical'> = {
  LOW: 'default',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'critical',
};

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  HEALTHY: 'success',
  DEGRADED: 'warning',
  FAILED: 'danger',
};

export function ServiceList() {
  const [filters, setFilters] = useState<Partial<ServiceFilterInput>>({ page: 1, limit: 20 });
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ServiceWithCounts | null>(null);

  const { data, isLoading, isError, error } = useServices(filters);
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();

  const handleEdit = (service: ServiceWithCounts) => {
    setSelected(service);
    setFormOpen(true);
  };

  const handleDelete = (service: ServiceWithCounts) => {
    setSelected(service);
    setDeleteOpen(true);
  };

  const handleCreate = () => {
    setSelected(null);
    setFormOpen(true);
  };

  if (isLoading) return <SkeletonCard />;
  if (isError) {
    return (
      <EmptyState
        icon={Server}
        title="Failed to load services"
        description={error.message}
      />
    );
  }

  const services = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ServiceFilters filters={filters} onChange={setFilters} className="flex-1" />
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No services found"
          description="Create your first service to start mapping dependencies."
          actionLabel="Add Service"
          onAction={handleCreate}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dependencies</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.owner}</p>
                    </div>
                  </TableCell>
                  <TableCell>{service.team}</TableCell>
                  <TableCell>
                    <Badge variant={criticalityVariant[service.criticality] ?? 'default'}>
                      {service.criticality}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[service.status] ?? 'default'}>
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{service.totalDependencies}</TableCell>
                  <TableCell>{formatDate(service.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(service)} aria-label={`Edit ${service.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(service)} aria-label={`Delete ${service.name}`}>
                        <Trash2 className="h-4 w-4 text-accent-rose" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data?.pagination && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          )}
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={selected ? 'Edit Service' : 'Create Service'}
        size="lg"
      >
        <ServiceForm
          service={selected ?? undefined}
          loading={createMutation.isPending || updateMutation.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={(formData) => {
            if (selected) {
              updateMutation.mutate(
                { id: selected.id, data: formData },
                { onSuccess: () => setFormOpen(false) },
              );
            } else {
              createMutation.mutate(formData, { onSuccess: () => setFormOpen(false) });
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Service"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (selected) {
            deleteMutation.mutate(selected.id, { onSuccess: () => setDeleteOpen(false) });
          }
        }}
      />
    </div>
  );
}
