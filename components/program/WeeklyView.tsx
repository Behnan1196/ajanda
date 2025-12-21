'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import WeeklyTaskCard from './WeeklyTaskCard'
import TaskFormModal from './TaskFormModal'
import AddQuickTodoButton from './AddQuickTodoButton'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    useDroppable,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'

interface Task {
    id: string
    title: string
    description: string | null
    task_type_id: string
    metadata: any
    due_date: string | null
    due_time: string | null
    is_completed: boolean
    task_types: {
        name: string
        slug: string
        icon: string | null
    }
    subjects?: {
        name: string
        icon: string | null
        color: string
    } | null
    topics?: {
        name: string
    } | null
    relationship?: {
        role_label: string
    } | null
}

interface WeeklyViewProps {
    userId: string
    onDateSelect?: (date: Date) => void
    relationshipId?: string // Context
}

export default function WeeklyView({ userId, onDateSelect = () => { }, relationshipId }: WeeklyViewProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()))
    const [weekTasks, setWeekTasks] = useState<Map<string, Task[]>>(new Map())
    const [loading, setLoading] = useState(true)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const supabase = createClient()

    // Drag & Drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    )

    // Helper to get start of week (Monday)
    function getStartOfWeek(date: Date) {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
        const start = new Date(d.setDate(diff))
        start.setHours(0, 0, 0, 0)
        return start
    }

    useEffect(() => {
        loadWeekTasks()
    }, [userId, currentWeekStart])

    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().split('T')[0]
    }

    const loadWeekTasks = async (silent = false) => {
        if (!silent) setLoading(true)

        const start = new Date(currentWeekStart)
        const end = new Date(start)
        end.setDate(end.getDate() + 6)
        end.setHours(23, 59, 59, 999)

        const startStr = toLocalISOString(start)
        const endStr = toLocalISOString(end)

        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        task_types (name, slug, icon),
        subjects (name, icon, color),
        topics (name),
        relationship:relationship_id (role_label)
      `)
            .eq('user_id', userId)
            .is('project_id', null)
            .gte('due_date', startStr)
            .lte('due_date', endStr)
            .order('sort_order', { ascending: true })
            .order('due_time', { ascending: true, nullsFirst: false })

        if (error) {
            console.error('Error loading tasks:', error)
        } else {
            const tasksMap = new Map<string, Task[]>()
            data?.forEach((task: any) => {
                if (task.due_date) {
                    const current = tasksMap.get(task.due_date) || []
                    // Sort by sort_order within the code as well for safety
                    current.push(task)
                    tasksMap.set(task.due_date, current)
                }
            })
            setWeekTasks(tasksMap)
        }
        if (!silent) setLoading(false)
    }

    const getDaysInWeek = () => {
        const days = []
        const start = new Date(currentWeekStart)
        for (let i = 0; i < 7; i++) {
            const d = new Date(start)
            d.setDate(d.getDate() + i)
            days.push(d)
        }
        return days
    }

    const isToday = (date: Date) => {
        return date.toDateString() === new Date().toDateString()
    }

    const getTaskIcon = (icon: string | null) => {
        if (!icon) return null
        if (icon === 'check-square') return '📝'
        if (icon === 'play-circle') return '🎥'
        if (icon === 'users') return '👥'
        return icon
    }

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newStart = new Date(currentWeekStart)
        newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7))
        setCurrentWeekStart(newStart)
    }

    const goToThisWeek = () => {
        setCurrentWeekStart(getStartOfWeek(new Date()))
    }

    // Task handling
    const handleTaskEdit = (task: Task) => {
        setEditingTask(task)
        setSelectedDate(new Date(task.due_date + 'T00:00:00')) // Set date context
        setShowTaskModal(true)
    }

    const handleTaskDelete = async (taskId: string) => {
        if (!confirm('Görevi silmek istediğinize emin misiniz?')) return

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        if (!error) loadWeekTasks(true)
        else alert('Silme hatası: ' + error.message)
    }

    const handleTaskSaved = () => {
        setShowTaskModal(false)
        setEditingTask(null)
        loadWeekTasks(true)
    }

    const handleTaskComplete = async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: true, completed_at: new Date().toISOString() })
            .eq('id', taskId)

        if (!error) loadWeekTasks(true) // Silent reload
    }

    const handleTaskUncomplete = async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({
                is_completed: false,
                completed_at: null,
            })
            .eq('id', taskId)

        if (!error) {
            loadWeekTasks(true) // Silent reload
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (!over) return

        const taskId = active.id as string
        const activeContainer = active.data.current?.sortable?.containerId || (active as any).id
        const overContainer = over.id as string

        // task.due_date is our container strategy here
        // We need to know if it's the same day or different day

        const activeTask = dataFlatten.find(t => t.id === taskId)
        if (!activeTask) return

        // 1. Cross-day move
        if (activeTask.due_date !== overContainer && overContainer.startsWith('202')) {
            // Optimistic update local state
            const updatedMap = new Map(weekTasks)
            const oldDayTasks = [...(updatedMap.get(activeTask.due_date!) || [])]
            const newDayTasks = [...(updatedMap.get(overContainer) || [])]

            const taskToMove = oldDayTasks.find(t => t.id === taskId)
            if (taskToMove) {
                const filteredOld = oldDayTasks.filter(t => t.id !== taskId)
                updatedMap.set(activeTask.due_date!, filteredOld)

                const movedTask = { ...taskToMove, due_date: overContainer }
                newDayTasks.push(movedTask)
                updatedMap.set(overContainer, newDayTasks)
                setWeekTasks(updatedMap)

                // Update database
                // Get next sort order for new day
                const nextSortOrder = newDayTasks.length
                await supabase
                    .from('tasks')
                    .update({
                        due_date: overContainer,
                        sort_order: nextSortOrder
                    })
                    .eq('id', taskId)

                loadWeekTasks(true)
            }
        }
        // 2. Same day reorder
        else if (active.id !== over.id) {
            const dateStr = activeTask.due_date!
            const dayTasks = [...(weekTasks.get(dateStr) || [])]
            const oldIndex = dayTasks.findIndex(t => t.id === active.id)
            const newIndex = dayTasks.findIndex(t => t.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const newDayTasks = arrayMove(dayTasks, oldIndex, newIndex)
                const updatedMap = new Map(weekTasks)
                updatedMap.set(dateStr, newDayTasks)
                setWeekTasks(updatedMap)

                // Batch update sort orders
                for (let i = 0; i < newDayTasks.length; i++) {
                    await supabase
                        .from('tasks')
                        .update({ sort_order: i })
                        .eq('id', newDayTasks[i].id)
                }
            }
        }
    }

    // Flatten all tasks for finding active task during drag
    const dataFlatten: Task[] = []
    weekTasks.forEach(tasks => dataFlatten.push(...tasks))

    const weekDays = getDaysInWeek()
    const monthName = currentWeekStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-900 capitalize">{monthName}</h2>
                    <button onClick={goToThisWeek} className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
                        Bu Hafta
                    </button>
                </div>

                <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map((date) => {
                    const dateStr = toLocalISOString(date)
                    const tasksForDay = weekTasks.get(dateStr) || []
                    const isDayToday = isToday(date)
                    const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' })
                    const dayShort = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })

                    return (
                        <div key={dateStr} className={`group flex flex-col gap-2 min-h-[200px] rounded-xl p-2 border ${isDayToday ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                            {/* Day Header */}
                            <button
                                onClick={() => onDateSelect(date)}
                                className="text-left w-full hover:bg-black/5 rounded p-1 transition"
                            >
                                <div className={`text-xs font-semibold uppercase ${isDayToday ? 'text-indigo-700' : 'text-gray-500'}`}>
                                    {dayName}
                                </div>
                                <div className={`text-sm font-bold ${isDayToday ? 'text-indigo-900' : 'text-gray-900'}`}>
                                    {dayShort}
                                </div>
                            </button>

                            {/* Add Task Button */}
                            <div className="px-1">
                                <button
                                    onClick={() => {
                                        setSelectedDate(date)
                                        setShowTaskModal(true)
                                    }}
                                    className="w-full py-1 text-xs text-indigo-600 font-medium hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-100 flex items-center justify-center gap-1 transition opacity-0 group-hover:opacity-100"
                                >
                                    <span>+</span> Ekle
                                </button>
                            </div>

                            {/* Tasks List */}
                            <div className="flex-1 space-y-2">
                                {tasksForDay.map(task => (
                                    // Minimal Task Card
                                    <div
                                        key={task.id}
                                        className={`bg-white p-2 rounded-lg shadow-sm border border-gray-100 text-xs ${task.is_completed ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-1">
                                            <span className="font-medium truncate line-clamp-2">{task.title}</span>
                                            {task.task_types.icon && <span className="text-base">{getTaskIcon(task.task_types.icon)}</span>}
                                        </div>

                                        {/* Assigner Badge */}
                                        {task.relationship?.role_label && (
                                            <div className="mt-1">
                                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded border border-indigo-100 inline-block font-medium">
                                                    {task.relationship.role_label}
                                                </span>
                                            </div>
                                        )}

                                        {task.due_time && (
                                            <div className="text-gray-500 mt-1 text-[10px]">
                                                {task.due_time.substring(0, 5)}
                                            </div>
                                        )}
                                        {/* Simple Checkbox for quick complete */}
                                        <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    task.is_completed ? handleTaskUncomplete(task.id) : handleTaskComplete(task.id)
                                                }}
                                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${task.is_completed
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                            >
                                                {task.is_completed && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {tasksForDay.length === 0 && (
                                    <div className="text-center py-4 text-gray-300 text-xs italic">
                                        Boş
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Task Form Modal */}
            {showTaskModal && (
                <TaskFormModal
                    userId={userId}
                    defaultDate={selectedDate}
                    onClose={() => setShowTaskModal(false)}
                    relationshipId={relationshipId} // Pass context
                    onTaskSaved={() => {
                        setShowTaskModal(false)
                        loadWeekTasks()
                    }}
                />
            )}
            <AddQuickTodoButton onTaskAdded={() => loadWeekTasks(true)} />
        </div>
    )
}
