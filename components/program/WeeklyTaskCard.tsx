import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import TaskMenu from './TaskMenu'

interface WeeklyTaskCardProps {
    task: any
    onEdit: () => void
    onDelete: () => void
    onComplete: () => void
    onUncomplete: () => void
    isOverlay?: boolean
}

export default function WeeklyTaskCard({
    task,
    onEdit,
    onDelete,
    onComplete,
    onUncomplete,
    isOverlay = false
}: WeeklyTaskCardProps) {
    const [showMenu, setShowMenu] = useState(false)

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
        opacity: isDragging ? 0 : 1,
        zIndex: isOverlay ? 1000 : undefined,
    }

    const getTaskIcon = () => {
        switch (task.task_types?.slug) {
            case 'video':
                return '🎥'
            case 'reading':
                return '📚'
            case 'exercise':
                return '🏃'
            case 'todo':
                return '✓'
            default:
                return task.task_types?.icon || '📝'
        }
    }

    return (
        <div
            ref={isOverlay ? undefined : setNodeRef}
            style={isOverlay ? undefined : style}
            className={`relative bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition group ${task.is_completed ? 'opacity-60' : ''} ${isOverlay ? 'shadow-xl ring-2 ring-indigo-400 rotate-2 cursor-grabbing' : ''
                }`}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 transition opacity-0 group-hover:opacity-100"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                </svg>
            </button>

            {/* Main Content - Clickable */}
            <div
                onClick={onEdit}
                className="pl-6 pr-8 cursor-pointer"
            >
                {/* Title */}
                <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{getTaskIcon()}</span>
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.title}
                        </h4>

                        {/* Time */}
                        {task.due_time && (
                            <span className="text-xs text-gray-500">
                                🕐 {task.due_time.slice(0, 5)}
                            </span>
                        )}

                        {/* Subject/Topic */}
                        {task.subjects && (
                            <div className="text-xs text-gray-500 mt-1">
                                {task.subjects.icon} {task.subjects.name}
                                {task.topics && ` › ${task.topics.name}`}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Menu and Toggle Buttons */}
            <div className="absolute right-2 top-2 flex flex-col gap-1 items-center">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(!showMenu)
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>

                {/* Direct Toggle Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        task.is_completed ? onUncomplete() : onComplete()
                    }}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${task.is_completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 text-transparent hover:border-green-500 hover:text-green-500'
                        }`}
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                    <div className="absolute right-0 mt-8 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(false)
                                onEdit()
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            ✏️ Düzenle
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(false)
                                task.is_completed ? onUncomplete() : onComplete()
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            {task.is_completed ? '↩️ Geri Al' : '✓ Tamamla'}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(false)
                                onDelete()
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            🗑️ Sil
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
