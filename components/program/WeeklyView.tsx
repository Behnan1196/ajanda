'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import WeeklyTaskCard from './WeeklyTaskCard'
import TaskFormModal from './TaskFormModal'
import QuickTodoModal from './QuickTodoModal'
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
    is_private: boolean
    subject_id: string | null
    topic_id: string | null
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
    const [showQuickTodoModal, setShowQuickTodoModal] = useState(false)
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
        if (task.is_private) {
            setShowQuickTodoModal(true)
        } else {
            setShowTaskModal(true)
        }
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
        setShowQuickTodoModal(false)
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
        const overId = over.id as string

        // Find which container we are dropping into
        let overContainer = overId
        // If dropped over a task (IDs don't start with 202), find that task's container
        if (!overContainer.startsWith('202')) {
            const overTask = dataFlatten.find(t => t.id === overId)
            if (overTask?.due_date) {
                overContainer = overTask.due_date
            }
        }

        const activeTask = dataFlatten.find(t => t.id === taskId)
        if (!activeTask) return

        const activeDate = activeTask.due_date!

        // 1. Cross-day move
        if (activeDate !== overContainer && overContainer.startsWith('202')) {
            // Optimistic update local state
            const updatedMap = new Map(weekTasks)
            const oldDayTasks = [...(updatedMap.get(activeDate) || [])]
            const newDayTasks = [...(updatedMap.get(overContainer) || [])]

            const taskToMoveIndex = oldDayTasks.findIndex(t => t.id === taskId)
            if (taskToMoveIndex !== -1) {
                const [taskToMove] = oldDayTasks.splice(taskToMoveIndex, 1)
                updatedMap.set(activeDate, oldDayTasks)

                // If dropped over a specific task in the new day, insert it there
                let insertIndex = newDayTasks.length
                if (!overId.startsWith('202')) {
                    insertIndex = newDayTasks.findIndex(t => t.id === overId)
                    if (insertIndex === -1) insertIndex = newDayTasks.length
                }

                const movedTask = { ...taskToMove, due_date: overContainer }
                newDayTasks.splice(insertIndex, 0, movedTask)
                updatedMap.set(overContainer, newDayTasks)
                setWeekTasks(updatedMap)

                // Update database
                await supabase
                    .from('tasks')
                    .update({ due_date: overContainer })
                    .eq('id', taskId)

                // Re-sort and update all items in target container
                for (let i = 0; i < newDayTasks.length; i++) {
                    await supabase
                        .from('tasks')
                        .update({ sort_order: i })
                        .eq('id', newDayTasks[i].id)
                }

                loadWeekTasks(true)
            }
        }
        // 2. Same day reorder
        else if (active.id !== over.id) {
            const dayTasks = [...(weekTasks.get(activeDate) || [])]
            const oldIndex = dayTasks.findIndex(t => t.id === active.id)
            const newIndex = dayTasks.findIndex(t => t.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const newDayTasks = arrayMove(dayTasks, oldIndex, newIndex)
                const updatedMap = new Map(weekTasks)
                updatedMap.set(activeDate, newDayTasks)
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {weekDays.map((date) => {
                        const dateStr = toLocalISOString(date)
                        const tasksForDay = weekTasks.get(dateStr) || []
                        const isDayToday = isToday(date)
                        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' })
                        const dayShort = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })

                        return (
                            <DroppableDay key={dateStr} id={dateStr} isToday={isDayToday}>
                                <div className="flex flex-col h-full">
                                    {/* Day Header */}
                                    <button
                                        onClick={() => onDateSelect(date)}
                                        className="text-left mb-2 transition hover:opacity-75"
                                    >
                                        <div className={`text-xs font-bold uppercase tracking-wider ${isDayToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                                            {dayName}
                                        </div>
                                        <div className={`text-base font-extrabold ${isDayToday ? 'text-indigo-700' : 'text-gray-900'}`}>
                                            {dayShort}
                                        </div>
                                    </button>

                                    {/* Tasks List */}
                                    <SortableContext items={tasksForDay.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex-1 space-y-2">
                                            {tasksForDay.map((task) => (
                                                <WeeklyTaskCard
                                                    key={task.id}
                                                    task={task}
                                                    onEdit={() => handleTaskEdit(task)}
                                                    onDelete={() => handleTaskDelete(task.id)}
                                                    onComplete={() => handleTaskComplete(task.id)}
                                                    onUncomplete={() => handleTaskUncomplete(task.id)}
                                                />
                                            ))}
                                            {tasksForDay.length === 0 && (
                                                <div className="text-center py-4 text-gray-300 text-xs italic">
                                                    Boş
                                                </div>
                                            )}
                                        </div>
                                    </SortableContext>

                                    {/* Add Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedDate(date)
                                            setShowTaskModal(true)
                                        }}
                                        className="mt-3 w-full py-1.5 border-2 border-dashed border-gray-200 rounded-lg text-xs font-medium text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition opacity-0 group-hover:opacity-100"
                                    >
                                        + Görev
                                    </button>
                                </div>
                            </DroppableDay>
                        )
                    })}
                </div>
            </DndContext>

            {showTaskModal && (
                <TaskFormModal
                    userId={userId}
                    editingTask={editingTask}
                    defaultDate={selectedDate}
                    onClose={() => {
                        setShowTaskModal(false)
                        setEditingTask(null)
                    }}
                    onTaskSaved={handleTaskSaved}
                    relationshipId={relationshipId}
                />
            )}

            {showQuickTodoModal && (
                <QuickTodoModal
                    onClose={() => {
                        setShowQuickTodoModal(false)
                        setEditingTask(null)
                    }}
                    onTaskAdded={handleTaskSaved}
                    editingTask={editingTask}
                    initialDate={selectedDate}
                />
            )}
            <AddQuickTodoButton onTaskAdded={() => loadWeekTasks(true)} />
        </div>
    )
}

function DroppableDay({ id, children, isToday }: { id: string, children: React.ReactNode, isToday: boolean }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    })

    return (
        <div
            ref={setNodeRef}
            className={`group flex flex-col gap-2 min-h-[200px] rounded-xl p-2 border transition-colors ${isOver
                ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-200 shadow-inner'
                : isToday
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                    : 'bg-gray-50 border-gray-200'
                }`}
        >
            {children}
        </div>
    )
}
