import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'

interface SortableTaskCardProps {
    task: any
    onComplete: () => void
    onUncomplete: () => void
    onEdit: () => void
    onDelete: () => void
}

export default function SortableTaskCard({ task, onComplete, onUncomplete, onEdit, onDelete }: SortableTaskCardProps) {
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
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 transition bg-white/80 rounded"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                </svg>
            </button>

            {/* Task Card with left padding for drag handle */}
            <div className="pl-8">
                <TaskCard
                    task={task}
                    onComplete={onComplete}
                    onUncomplete={onUncomplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </div>
        </div>
    )
}
