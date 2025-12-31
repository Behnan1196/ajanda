import { useSortable } from '@dnd-kit/sortable'
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
}

export default function SortableTaskCard({ task, onComplete, onUncomplete, onEdit, onDelete, onStyle, userId, onAction }: SortableTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
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
            />
        </div>
    )
}
