'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Criticality, ServiceStatus } from '@dbrs/shared';
import { Search, AlertTriangle, Trash2, Plus } from 'lucide-react';
import { useDependencyGraph, useDependencyCycles, useCreateDependency, useDeleteDependency } from '@/hooks/use-dependencies';
import { useUiStore } from '@/store/ui-store';
import { DependencyForm } from './DependencyForm';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GitBranch } from 'lucide-react';

const criticalityColors: Record<Criticality, string> = {
  [Criticality.LOW]: '#64748b',
  [Criticality.MEDIUM]: '#6366f1',
  [Criticality.HIGH]: '#f59e0b',
  [Criticality.CRITICAL]: '#ef4444',
};

const statusBorder: Record<ServiceStatus, string> = {
  [ServiceStatus.HEALTHY]: '#34d399',
  [ServiceStatus.DEGRADED]: '#fbbf24',
  [ServiceStatus.FAILED]: '#fb7185',
};

function ServiceNode({ data }: { data: { label: string; criticality: Criticality; status: ServiceStatus; team: string; highlighted: boolean } }) {
  return (
    <div
      className={`rounded-lg border-2 bg-surface-raised px-4 py-3 shadow-lg transition-all ${
        data.highlighted ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface' : ''
      }`}
      style={{ borderColor: statusBorder[data.status] }}
    >
      <div className="flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: criticalityColors[data.criticality] }}
        />
        <span className="text-sm font-medium text-white">{data.label}</span>
      </div>
      <p className="mt-1 text-xs text-gray-500">{data.team}</p>
    </div>
  );
}

const nodeTypes = { service: ServiceNode };

export function DependencyGraph() {
  const { data: graph, isLoading, isError, error } = useDependencyGraph();
  const { data: cycles } = useDependencyCycles();
  const createMutation = useCreateDependency();
  const deleteMutation = useDeleteDependency();

  const searchQuery = useUiStore((s) => s.graphSearchQuery);
  const setGraphSearchQuery = useUiStore((s) => s.setGraphSearchQuery);
  const highlightedNodeIds = useUiStore((s) => s.highlightedNodeIds);
  const setHighlightedNodeIds = useUiStore((s) => s.setHighlightedNodeIds);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const layoutNodes = useCallback(
    (graphData: NonNullable<typeof graph>) => {
      const cols = Math.ceil(Math.sqrt(graphData.nodes.length));
      const spacing = { x: 220, y: 120 };

      const matchingIds = searchQuery
        ? graphData.nodes
            .filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((n) => n.id)
        : [];

      if (searchQuery) {
        setHighlightedNodeIds(matchingIds);
      }

      const flowNodes: Node[] = graphData.nodes.map((node, index) => ({
        id: node.id,
        type: 'service',
        position: {
          x: (index % cols) * spacing.x,
          y: Math.floor(index / cols) * spacing.y,
        },
        data: {
          label: node.name,
          criticality: node.criticality,
          status: node.status,
          team: node.team,
          highlighted: highlightedNodeIds.includes(node.id) || matchingIds.includes(node.id),
        },
      }));

      const flowEdges: Edge[] = graphData.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: highlightedNodeIds.includes(edge.source) || highlightedNodeIds.includes(edge.target),
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        style: {
          stroke: highlightedNodeIds.includes(edge.source) || highlightedNodeIds.includes(edge.target)
            ? '#818cf8'
            : '#2d3548',
          strokeWidth: 2,
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    },
    [searchQuery, highlightedNodeIds, setHighlightedNodeIds, setNodes, setEdges],
  );

  useEffect(() => {
    if (graph) layoutNodes(graph);
  }, [graph, layoutNodes]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full rounded-xl" />;
  }

  if (isError) {
    return (
      <EmptyState
        icon={GitBranch}
        title="Failed to load dependency graph"
        description={error.message}
      />
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="No dependencies yet"
        description="Add services and create dependencies to visualize your graph."
        actionLabel="Add Dependency"
        onAction={() => setFormOpen(true)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {cycles?.hasCycle && (
        <Card padding="sm" className="border-accent-amber/30 bg-accent-amber/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-accent-amber" />
            <div>
              <p className="text-sm font-medium text-accent-amber">Circular dependency detected</p>
              <p className="mt-1 text-xs text-gray-400">
                Cycle involves: {cycles.cycleServices?.join(' → ') ?? 'unknown services'}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="h-[600px] overflow-hidden rounded-xl border border-surface-border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#2d3548" gap={20} />
          <Controls showInteractive />
          <MiniMap
            nodeColor={(n) => criticalityColors[(n.data as { criticality: Criticality }).criticality] ?? '#6366f1'}
            maskColor="rgba(15, 20, 25, 0.8)"
          />
          <Panel position="top-left" className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setGraphSearchQuery(e.target.value)}
                className="pl-10 bg-surface-raised/90 backdrop-blur"
                aria-label="Search graph nodes"
              />
            </div>
            <Button onClick={() => setFormOpen(true)} size="sm">
              <Plus className="h-4 w-4" />
              Add
            </Button>
            {selectedEdgeId && (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete Edge
              </Button>
            )}
          </Panel>
          <Panel position="top-right">
            <Badge variant="brand">{graph.nodes.length} services</Badge>
            <Badge variant="default" className="ml-2">
              {graph.edges.length} edges
            </Badge>
          </Panel>
        </ReactFlow>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add Dependency">
        <DependencyForm
          loading={createMutation.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={(data) =>
            createMutation.mutate(data, { onSuccess: () => setFormOpen(false) })
          }
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Dependency"
        description="Remove this dependency edge from the graph?"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (selectedEdgeId) {
            deleteMutation.mutate(selectedEdgeId, {
              onSuccess: () => {
                setDeleteOpen(false);
                setSelectedEdgeId(null);
              },
            });
          }
        }}
      />
    </div>
  );
}
