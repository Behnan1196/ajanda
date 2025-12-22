import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useRef, useEffect } from 'react'

interface Habit {
    id: string
    name: string
    description: string | null
    color: string
    icon: string
    current_streak: number
    longest_streak: number
}

interface CompactHabitRowProps {
    habit: Habit
    weekDates: Date[]
    isCompleted: (habitId: string, date: Date) => boolean
    isToday: (date: Date) => boolean
    toggleCompletion: (habitId: string, date: Date) => void
    onEdit: (habit: Habit) => void
    onDelete: (habitId: string) => void
}

export function CompactHabitRow({
    habit,
    weekDates,
    isCompleted,
    isToday,
    toggleCompletion,
    onEdit,
    onDelete
}: CompactHabitRowProps) {
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: habit.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: `${habit.color}15`, // Use habit color for row background (pastel)
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <tr ref={setNodeRef} style={style} className="border-b border-gray-100 hover:brightness-95 transition">
            {/* Compact Menu (Formerly Drag Handle Column) */}
            <td className="p-2 w-8">
                <div className="flex flex-col items-center">
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-gray-400 hover:text-indigo-600 p-1"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>
                        {showMenu && (
                            <div className="absolute left-full top-0 ml-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                                <button
                                    onClick={() => {
                                        onEdit(habit)
                                        setShowMenu(false)
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <span>✏️</span> Düzenle
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(habit.id)
                                        setShowMenu(false)
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <span>🗑️</span> Sil
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </td>

            {/* Habit Name (Draggable area) */}
            <td className="p-2 min-w-[60px] max-w-[120px]">
                <div
                    {...attributes}
                    {...listeners}
                    className="flex items-center gap-2 pl-1 cursor-grab active:cursor-grabbing hover:bg-black/5 rounded px-1 -ml-1 transition-colors select-none"
                    title="Sıralamak için sürükleyin"
                >
                    <span className="text-sm font-semibold text-gray-900 truncate">
                        <span className="hidden sm:inline">{habit.name}</span>
                        <span className="sm:hidden">{habit.name.substring(0, 5)}</span>
                    </span>
                </div>
            </td>

            {/* Week Days */}
            {weekDates.map((date, i) => (
                <td key={i} className="p-1 px-1 sm:px-2 text-center">
                    <button
                        onClick={() => toggleCompletion(habit.id, date)}
                        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all border-2 ${isCompleted(habit.id, date)
                            ? 'text-white border-[#10B981] bg-[#10B981] shadow-sm'
                            : 'bg-transparent border-black/5 text-transparent hover:border-black/20'
                            } ${isToday(date) && !isCompleted(habit.id, date) ? 'border-indigo-400/30' : ''}`}
                    >
                        {isCompleted(habit.id, date) ? '✓' : ''}
                    </button>
                </td>
            ))}
        </tr>
    )
}
