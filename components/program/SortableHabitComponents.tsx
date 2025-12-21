import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Habit {
    id: string
    name: string
    description: string | null
    color: string
    icon: string
    current_streak: number
    longest_streak: number
}

// Sortable components for drag & drop
interface SortableHabitRowProps {
    habit: Habit
    weekDates: Date[]
    isCompleted: (habitId: string, date: Date) => boolean
    isToday: (date: Date) => boolean
    toggleCompletion: (habitId: string, date: Date) => void
}

function SortableHabitRow({ habit, weekDates, isCompleted, isToday, toggleCompletion }: SortableHabitRowProps) {
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
    }

    return (
        <tr ref={setNodeRef} style={style} className="border-b border-gray-100 hover:bg-gray-50 transition">
            {/* Drag Handle */}
            <td className="p-4 w-8">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 transition"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                    </svg>
                </button>
            </td>

            {/* Habit Info */}
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${habit.color}15` }}
                    >
                        {habit.icon}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">{habit.name}</div>
                        {habit.current_streak > 0 && (
                            <div className="text-xs text-gray-500">
                                🔥 {habit.current_streak} gün
                            </div>
                        )}
                    </div>
                </div>
            </td>

            {/* Week Days */}
            {weekDates.map((date, i) => (
                <td key={i} className="text-center p-4">
                    <button
                        onClick={() => toggleCompletion(habit.id, date)}
                        className={`w-10 h-10 rounded-full transition-all ${isCompleted(habit.id, date)
                            ? 'text-white shadow-md'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                        style={isCompleted(habit.id, date) ? { backgroundColor: habit.color } : {}}
                    >
                        {isCompleted(habit.id, date) ? '✓' : '○'}
                    </button>
                </td>
            ))}
        </tr>
    )
}

interface SortableHabitCardProps {
    habit: Habit
    weekDates: Date[]
    dayNames: string[]
    isCompleted: (habitId: string, date: Date) => boolean
    isToday: (date: Date) => boolean
    toggleCompletion: (habitId: string, date: Date) => void
}

function SortableHabitCard({ habit, weekDates, dayNames, isCompleted, isToday, toggleCompletion }: SortableHabitCardProps) {
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
    }

    return (
        <div ref={setNodeRef} style={style} className="bg-white rounded-2xl p-4 shadow-sm">
            {/* Header with Drag Handle */}
            <div className="flex items-center gap-3 mb-3">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 transition flex-shrink-0"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                    </svg>
                </button>

                <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${habit.color}15` }}
                >
                    {habit.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">{habit.name}</div>
                    {habit.current_streak > 0 && (
                        <div className="text-xs text-gray-500">
                            🔥 {habit.current_streak} gün streak
                        </div>
                    )}
                </div>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-1">
                {weekDates.map((date, i) => (
                    <button
                        key={i}
                        onClick={() => toggleCompletion(habit.id, date)}
                        className="flex flex-col items-center p-2 rounded-lg transition"
                    >
                        <div className={`text-[10px] mb-1 ${isToday(date) ? 'text-indigo-600 font-bold' : 'text-gray-500'}`}>
                            {dayNames[i]}
                        </div>
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${isCompleted(habit.id, date)
                                ? 'text-white shadow-md'
                                : 'bg-gray-100 text-gray-400'
                                }`}
                            style={isCompleted(habit.id, date) ? { backgroundColor: habit.color } : {}}
                        >
                            {isCompleted(habit.id, date) ? '✓' : date.getDate()}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

export { SortableHabitRow, SortableHabitCard }
