// Drag to reorder (dnd-kit). The dragged row lifts (scale 1.02 + lift shadow) and
// a dashed placeholder marks where it will land (handoff 2.10, 3.5).
import { useState, type ReactNode } from 'react';
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from './Icon';

export interface DragState {
  /** The drag handle, to put in the row's lead slot. */
  handle: ReactNode;
  lifted: boolean;
}

interface Props<T extends { id: string }> {
  items: T[];
  onReorder: (ids: string[]) => void;
  render: (item: T, state: DragState) => ReactNode;
}

function Item<T extends { id: string }>({ item, render }: { item: T; render: Props<T>['render'] }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const handle = (
    <span ref={setActivatorNodeRef} className="ft-handle" {...attributes} aria-label="Drag to reorder" {...listeners}>
      <Icon name="grip-vertical" size={22} />
    </span>
  );
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      {isDragging ? (
        <div style={{ padding: '6px 16px' }}><div className="ft-placeholder" style={{ margin: 0 }} /></div>
      ) : (
        render(item, { handle, lifted: false })
      )}
    </div>
  );
}

export function SortableList<T extends { id: string }>({ items, onReorder, render }: Props<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => i.id === e.active.id);
    const to = items.findIndex((i) => i.id === e.over!.id);
    if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to).map((i) => i.id));
  };
  const active = items.find((i) => i.id === activeId);
  return (
    <DndContext
      sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]}
      onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onEnd} onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => <Item key={item.id} item={item} render={render} />)}
      </SortableContext>
      <DragOverlay>
        {active ? render(active, { handle: <span className="ft-handle"><Icon name="grip-vertical" size={22} /></span>, lifted: true }) : null}
      </DragOverlay>
    </DndContext>
  );
}
