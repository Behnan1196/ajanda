import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'

interface SortableTaskCardProps {
    task: any
    onComplete: () => void
    onUncomplete: () => void
    onEdit: () => void
    onDelete: () => void
    onStyle?: () => void
    userId?: string
    onAction?: (taskId: string, action: string, data?: any) => void
    index?: number
    activeId?: string | null
}

export default function SortableTaskCard({
    task,
    onComplete,
    onUncomplete,
    onEdit,
    onDelete,
    onStyle,
    userId,
    onAction,
    index,
    activeId
}: SortableTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 100 : 1
    }

    const children = task.children || []
    const localActiveIndex = children.findIndex((c: any) => c.id === activeId)

    // Determine drop indicator
    let dropIndicator: 'none' | 'top' | 'bottom' = 'none'
    // For root level, the parent passes index/activeId. 
    // For nested level, we use localActiveIndex if available.
    if (isOver && !isDragging && activeId !== undefined && index !== undefined) {
        // If activeId is in this sibling list, use its index. Otherwise assume it's coming from outside.
        const effectiveActiveIndex = localActiveIndex !== -1 ? localActiveIndex : -1
        dropIndicator = index > effectiveActiveIndex ? 'bottom' : 'top'
    }

    return (
        <div ref={setNodeRef} style={style} className="relative">
            <TaskCard
                task={task}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onStyle={onStyle}
                dragAttributes={attributes}
                dragListeners={listeners}
                userId={userId}
                onAction={onAction}
                isBeingHovered={isOver && !isDragging}
                dropIndicator={dropIndicator}
            >
                {children.length > 0 && (
                    <SortableContext items={children.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
                        {children.map((child: any, childIdx: number) => (
                            <SortableTaskCard
                                key={child.id}
                                task={child}
                                onComplete={() => onAction?.(child.id, 'complete')}
                                onUncomplete={() => onAction?.(child.id, 'uncomplete')}
                                onEdit={() => onAction?.(child.id, 'edit')}
                                onDelete={() => onAction?.(child.id, 'delete')}
                                onStyle={() => onAction?.(child.id, 'style')}
                                onAction={onAction}
                                userId={userId}
                                index={childIdx}
                                activeId={activeId}
                            />
                        ))}
                    </SortableContext>
                )}
            </TaskCard>
        </div>
    )
}
