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
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        backgroundColor: isDragging ? '#f3f4f6' : `${habit.color}15`,
        zIndex: isDragging ? 50 : undefined,
        position: isDragging ? 'relative' as const : undefined,
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
        <tr ref={setNodeRef} style={style} className="border-b border-gray-100 group">
            {/* Compact Menu */}
            <td className="p-3 w-10">
                <div className="flex items-center justify-center">
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-gray-300 hover:text-indigo-600 p-1 rounded-lg hover:bg-white transition-all active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01" />
                            </svg>
                        </button>
                        {showMenu && (
                            <div className="absolute left-full top-0 ml-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                                <button
                                    onClick={() => {
                                        onEdit(habit)
                                        setShowMenu(false)
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                                >
                                    <span>✏️</span> Düzenle
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(habit.id)
                                        setShowMenu(false)
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                    <span>🗑️</span> Sil
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </td>

            {/* Habit Name */}
            <td className="p-3 min-w-[100px]">
                <div
                    {...attributes}
                    {...listeners}
                    style={{ touchAction: 'none' }}
                    className="flex flex-col cursor-grab active:cursor-grabbing hover:bg-white/50 rounded-xl px-2 py-1 -ml-2 transition-all select-none"
                    title="Sıralamak için sürükleyin"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-[18px] mb-0.5">{habit.icon}</span>
                        <span className="text-sm font-black text-gray-900 leading-tight">
                            {habit.name}
                        </span>
                    </div>
                    {habit.current_streak > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">🔥 {habit.current_streak} GÜNLÜK SERİ</span>
                        </div>
                    )}
                </div>
            </td>

            {/* Week Days */}
            {weekDates.map((date, i) => {
                const completed = isCompleted(habit.id, date)
                const today = isToday(date)
                return (
                    <td key={i} className="p-2 text-center">
                        <button
                            onClick={() => toggleCompletion(habit.id, date)}
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 active:scale-75 ${completed
                                    ? 'text-white border-indigo-600 bg-indigo-600 shadow-lg shadow-indigo-100'
                                    : today
                                        ? 'bg-white border-indigo-200 text-transparent hover:border-indigo-400'
                                        : 'bg-white border-gray-100 text-transparent hover:border-gray-300'
                                }`}
                        >
                            <svg className={`w-5 h-5 transition-transform duration-300 ${completed ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    </td>
                )
            })}
        </tr>
    )
}
