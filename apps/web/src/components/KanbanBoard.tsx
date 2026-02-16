'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Lead, LeadStatus } from '@/lib/types';
import { PIPELINE_STATUSES, type PipelineStatus } from '@/lib/constants';
import LeadCard from './LeadCard';

/* ──────────────────────────────────────────────
   Props
   ────────────────────────────────────────────── */

interface KanbanBoardProps {
  leads: Lead[];
  statuses?: PipelineStatus[];
  onTransition: (leadId: string, newStatus: LeadStatus) => void;
  onLeadClick: (lead: Lead) => void;
}

/* ──────────────────────────────────────────────
   Draggable card wrapper
   ────────────────────────────────────────────── */

function DraggableCard({
  lead,
  onLeadClick,
}: {
  lead: Lead;
  onLeadClick: (lead: Lead) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <LeadCard lead={lead} onClick={onLeadClick} />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Droppable column
   ────────────────────────────────────────────── */

function KanbanColumn({
  status,
  leads,
  onLeadClick,
}: {
  status: PipelineStatus;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: status.key,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 flex flex-col bg-gray-50 rounded-lg border transition-colors ${
        isOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200'
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
          >
            {status.label}
          </span>
        </div>
        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
          {leads.length}
        </span>
      </div>

      {/* Cards area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
        {leads.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            אין לידים
          </p>
        )}
        {leads.map((lead) => (
          <DraggableCard key={lead.id} lead={lead} onLeadClick={onLeadClick} />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main board
   ────────────────────────────────────────────── */

export default function KanbanBoard({
  leads,
  statuses = PIPELINE_STATUSES,
  onTransition,
  onLeadClick,
}: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Group leads by status
  const leadsByStatus: Record<string, Lead[]> = {};
  for (const status of statuses) {
    leadsByStatus[status.key] = [];
  }
  for (const lead of leads) {
    if (leadsByStatus[lead.status]) {
      leadsByStatus[lead.status].push(lead);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const lead = leads.find((l) => l.id === active.id);
    setActiveLead(lead ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    // Find the lead to check its current status
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    onTransition(leadId, newStatus);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]" dir="rtl">
        {statuses.map((status) => (
          <KanbanColumn
            key={status.key}
            status={status}
            leads={leadsByStatus[status.key] || []}
            onLeadClick={onLeadClick}
          />
        ))}
      </div>

      {/* Drag overlay – shows a card preview following the cursor */}
      <DragOverlay>
        {activeLead ? (
          <div className="rotate-2 opacity-90">
            <LeadCard lead={activeLead} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
