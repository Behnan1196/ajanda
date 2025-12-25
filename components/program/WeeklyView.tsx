'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import WeeklyTaskCard from './WeeklyTaskCard'
import TaskFormModal from './TaskFormModal'
import QuickTodoModal from './QuickTodoModal'
import { db } from '@/lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import {
    DndContext,
    closestCorners,
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
    sort_order?: number
}

interface WeeklyViewProps {
    userId: string
    onDateSelect?: (date: Date) => void
    relationshipId?: string // Context
    isTutorMode?: boolean
}

export default function WeeklyView({ userId, onDateSelect = () => { }, relationshipId, isTutorMode = false }: WeeklyViewProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()))
    const [weekTasks, setWeekTasks] = useState<Map<string, Task[]>>(new Map())
    const [loading, setLoading] = useState(true)

    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().split('T')[0]
    }

    // Local-first logic: Use IndexedDB if viewing own tasks
    const startStr = toLocalISOString(currentWeekStart)
    const end = new Date(currentWeekStart)
    end.setDate(end.getDate() + 6)
    const endStr = toLocalISOString(end)

    const localTasks = useLiveQuery(
        () => db.tasks.where('user_id').equals(userId).and(t => t.due_date! >= startStr && t.due_date! <= endStr).toArray(),
        [userId, startStr, endStr]
    )

    useEffect(() => {
        const enrichTasks = async () => {
            if (localTasks) {
                const tasksMap = new Map<string, Task[]>()

                const enriched = await Promise.all(localTasks.map(async (t) => {
                    const type = await db.task_types.get(t.task_type_id)
                    const subject = t.subject_id ? await db.subjects.get(t.subject_id) : null
                    return {
                        ...t,
                        task_types: type || { name: 'Görev', slug: 'todo', icon: '📝' },
                        subjects: subject || null
                    }
                }))

                enriched.forEach((task: any) => {
                    if (task.due_date) {
                        const current = tasksMap.get(task.due_date) || []
                        current.push(task)
                        tasksMap.set(task.due_date, current)
                    }
                })
                // Sort tasks within each day by sort_order
                tasksMap.forEach((tasks, date) => {
                    tasks.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                })
                setWeekTasks(tasksMap)
                setLoading(false)
            }
        }
        enrichTasks()
    }, [localTasks])
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [showQuickTodoModal, setShowQuickTodoModal] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [activeId, setActiveId] = useState<string | null>(null)
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

    const loadWeekTasks = async (silent = false) => {
        if (isTutorMode && userId !== undefined) {
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

            if (!error && data) {
                const tasksMap = new Map<string, Task[]>()
                data.forEach((task: any) => {
                    if (task.due_date) {
                        const current = tasksMap.get(task.due_date) || []
                        current.push(task)
                        tasksMap.set(task.due_date, current)
                    }
                })
                setWeekTasks(tasksMap)
            }
            if (!silent) setLoading(false)
        }
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

        // Local Update
        await db.tasks.delete(taskId)

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        if (error) console.error('Remote delete failed:', error)
    }

    const handleTaskSaved = () => {
        setShowTaskModal(false)
        setShowQuickTodoModal(false)
        setEditingTask(null)
        loadWeekTasks(true)
    }

    const handleTaskComplete = async (taskId: string) => {
        const updateData = {
            is_completed: true,
            completed_at: new Date().toISOString(),
            is_dirty: 1
        }

        await db.tasks.update(taskId, updateData)

        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: true, completed_at: updateData.completed_at })
            .eq('id', taskId)

        if (!error) await db.tasks.update(taskId, { is_dirty: 0 })
    }

    const handleTaskUncomplete = async (taskId: string) => {
        const updateData = {
            is_completed: false,
            completed_at: null,
            is_dirty: 1
        }

        await db.tasks.update(taskId, updateData)

        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: false, completed_at: null })
            .eq('id', taskId)

        if (!error) await db.tasks.update(taskId, { is_dirty: 0 })
    }

    // Flatten all tasks for finding active task during drag
    const dataFlatten: Task[] = []
    weekTasks.forEach(tasks => dataFlatten.push(...tasks))

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id)
    }

    const handleDragOver = (event: any) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        // Find the containers
        const activeContainer = active.data.current?.sortable?.containerId
        let overContainer = over.data.current?.sortable?.containerId || overId

        // If dropped over a task that doesn't have containerId in data, fallback
        if (typeof overContainer === 'string' && !overContainer.startsWith('202')) {
            const overTask = dataFlatten.find(t => t.id === overContainer)
            if (overTask?.due_date) {
                overContainer = overTask.due_date
            }
        }

        if (!activeContainer || !overContainer) {
            return
        }

        if (activeContainer !== overContainer) {
            setWeekTasks((prev) => {
                const updatedMap = new Map(prev)
                const activeItems = [...(updatedMap.get(activeContainer) || [])]
                const overItems = [...(updatedMap.get(overContainer) || [])]

                const activeIndex = activeItems.findIndex((item) => item.id === activeId)
                let overIndex = overItems.findIndex((item) => item.id === overId)

                if (activeIndex !== -1) {
                    const [item] = activeItems.splice(activeIndex, 1)
                    const newItem = { ...item, due_date: overContainer }

                    if (overIndex === -1) {
                        overItems.push(newItem)
                    } else {
                        overItems.splice(overIndex, 0, newItem)
                    }

                    updatedMap.set(activeContainer, activeItems)
                    updatedMap.set(overContainer, overItems)
                }

                return updatedMap
            })
        } else if (activeId !== overId) {
            // Same day reorder real-time preview
            setWeekTasks((prev) => {
                const updatedMap = new Map(prev)
                const items = [...(updatedMap.get(activeContainer) || [])]
                const oldIndex = items.findIndex((item) => item.id === activeId)
                const newIndex = items.findIndex((item) => item.id === overId)

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newItems = arrayMove(items, oldIndex, newIndex)
                    updatedMap.set(activeContainer, newItems)
                }

                return updatedMap
            })
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const taskId = active.id as string
        const overId = over.id as string

        // Find current container of active item
        const activeTask = dataFlatten.find(t => t.id === taskId)
        if (!activeTask) return

        const activeContainer = activeTask.due_date!
        let overContainer = over.data?.current?.sortable?.containerId || overId

        // Ensure overContainer is a valid date string
        if (typeof overContainer === 'string' && !overContainer.startsWith('202')) {
            const overTask = dataFlatten.find(t => t.id === overId)
            if (overTask?.due_date) {
                overContainer = overTask.due_date
            }
        }

        if (active.id !== over.id || activeContainer !== overContainer) {
            const dayTasks = [...(weekTasks.get(overContainer as string) || [])]

            // Re-sort and update all items in target container
            for (let i = 0; i < dayTasks.length; i++) {
                await supabase
                    .from('tasks')
                    .update({
                        sort_order: i,
                        due_date: overContainer // Ensure due_date is updated too
                    })
                    .eq('id', dayTasks[i].id)
            }

            loadWeekTasks(true)
        }
    }

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
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
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
                                    <div className="flex-1">
                                        <SortableContext
                                            id={dateStr}
                                            items={tasksForDay.map(t => t.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="space-y-2 min-h-[50px]">
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
                                    </div>

                                    {/* Add Buttons */}
                                    <div className="mt-3 flex flex-col gap-1.5 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setSelectedDate(date)
                                                setEditingTask(null)
                                                if (isTutorMode) {
                                                    setShowTaskModal(true)
                                                } else {
                                                    setShowQuickTodoModal(true)
                                                }
                                            }}
                                            className="w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-[10px] font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-white transition shadow-sm"
                                        >
                                            + GÖREV EKLE
                                        </button>
                                    </div>
                                </div>
                            </DroppableDay>
                        )
                    })}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div className="w-[280px]">
                            <WeeklyTaskCard
                                task={dataFlatten.find(t => t.id === activeId)}
                                onEdit={() => { }}
                                onDelete={() => { }}
                                onComplete={() => { }}
                                onUncomplete={() => { }}
                                isOverlay
                            />
                        </div>
                    ) : null}
                </DragOverlay>
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
