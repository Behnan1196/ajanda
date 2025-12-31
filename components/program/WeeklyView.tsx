'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProjectTask } from '@/app/actions/projects'
import SortableTaskCard from './SortableTaskCard'
import TaskCard from './TaskCard'
import TaskFormModal from './TaskFormModal'
import QuickTodoModal from './QuickTodoModal'
import TaskStyleModal from './TaskStyleModal'
import CompactDailyNutrition from './CompactDailyNutrition'
import CompactDailyPractice from './CompactDailyPractice'
import DraggableSpecializedSummary from './DraggableSpecializedSummary'
import {
    DndContext,
    closestCorners,
    pointerWithin,
    rectIntersection,
    getFirstCollision,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    useDroppable,
    CollisionDetection,
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
    project_id?: string
    metadata: any
    due_date: string | null
    due_time: string | null
    is_completed: boolean
    is_private: boolean
    task_types: {
        name: string
        slug: string
        icon: string | null
    }
    relationship?: {
        role_label: string
    } | null
    sort_order?: number
    parent_id?: string | null
    children?: Task[]
}

interface WeeklyViewProps {
    userId: string
    onDateSelect?: (date: Date) => void
    relationshipId?: string // Context
    isTutorMode?: boolean
    initialDate?: Date | null
}

export default function WeeklyView({
    userId,
    onDateSelect = () => { },
    relationshipId,
    isTutorMode = false,
    initialDate
}: WeeklyViewProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(initialDate || new Date()))
    const [weekTasks, setWeekTasks] = useState<Map<string, Task[]>>(new Map())
    const [specializedTasks, setSpecializedTasks] = useState<Map<string, Task[]>>(new Map())
    const [loading, setLoading] = useState(true)
    const [showQuickTodoModal, setShowQuickTodoModal] = useState(false)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [styleModalConfig, setStyleModalConfig] = useState<{ task: Task | null; isOpen: boolean }>({ task: null, isOpen: false })
    const [activeId, setActiveId] = useState<string | null>(null)
    const supabase = createClient()

    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().split('T')[0]
    }

    const buildTaskTree = (flatTasks: Task[]) => {
        const taskMap = new Map<string, any>()
        const roots: any[] = []

        flatTasks.forEach(task => {
            taskMap.set(task.id, { ...task, children: [] })
        })

        flatTasks.forEach(task => {
            const taskInMap = taskMap.get(task.id)
            if (task.parent_id && taskMap.has(task.parent_id)) {
                taskMap.get(task.parent_id).children.push(taskInMap)
            } else {
                roots.push(taskInMap)
            }
        })

        return roots
    }

    const handleTaskAction = (taskId: string, action: string) => {
        const allTasks = Array.from(weekTasks.values()).flat()
        const task = allTasks.find(t => t.id === taskId)

        switch (action) {
            case 'complete': handleTaskComplete(taskId); break
            case 'uncomplete': handleTaskUncomplete(taskId); break
            case 'edit': if (task) handleTaskEdit(task); break
            case 'delete': handleTaskDelete(taskId); break
            case 'style': if (task) setStyleModalConfig({ task: task, isOpen: true }); break
        }
    }


    // Drag & Drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    )

    /**
     * Custom collision detection strategy
     * Prioritize pointerWithin for containers to prevent "long card" overlap issues
     */
    const customCollisionDetection: CollisionDetection = (args) => {
        // 1. First, check pointer collisions for specific tasks
        const pointerCollisions = pointerWithin(args)

        // 2. If we are over a task card, return that collision immediately for precise sorting
        const taskCollision = pointerCollisions.find(c => dataFlatten.some(t => t.id === c.id))
        if (taskCollision) return [taskCollision]

        // 3. Then prioritize containers (days) if we are in the day area but not over a specific card
        const containerCollision = pointerCollisions.find(c => weekTasks.has(c.id as string))
        if (containerCollision) return [containerCollision]

        // 4. Default to closest corners
        return closestCorners(args)
    }

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

    useEffect(() => {
        if (initialDate) {
            setCurrentWeekStart(getStartOfWeek(initialDate))
        }
    }, [initialDate])

    const loadWeekTasks = async (silent = false) => {
        if (userId === undefined) return
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
                task_types!inner (name, slug, icon),
                relationship:relationship_id (role_label)
            `)
            .eq('user_id', userId)
            .gte('due_date', startStr)
            .lte('due_date', endStr)
            .order('sort_order', { ascending: true })

        if (!error && data) {
            const tasksMap = new Map<string, Task[]>()
            const specMap = new Map<string, Task[]>()
            const days = getDaysInWeek()

            days.forEach(d => {
                const ds = toLocalISOString(d)
                tasksMap.set(ds, [])
                specMap.set(ds, [])
            })

            data.forEach((task: any) => {
                if (task.due_date) {
                    const slug = task.task_types?.slug
                    if (slug === 'nutrition' || slug === 'music') {
                        const current = specMap.get(task.due_date) || []
                        current.push(task)
                        specMap.set(task.due_date, current)
                    } else {
                        const current = tasksMap.get(task.due_date) || []
                        current.push(task)
                        tasksMap.set(task.due_date, current)
                    }
                }
            })
            setWeekTasks(tasksMap)
            setSpecializedTasks(specMap)
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

        if (error) {
            console.error('Remote delete failed:', error)
        } else {
            loadWeekTasks(true)
        }
    }

    const handleTaskSaved = () => {
        setShowTaskModal(false)
        setShowQuickTodoModal(false)
        setEditingTask(null)
        loadWeekTasks(true)
    }

    const handleTaskComplete = async (taskId: string) => {
        const completedAt = new Date().toISOString()
        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: true, completed_at: completedAt })
            .eq('id', taskId)

        if (!error) {
            loadWeekTasks(true)
        }
    }

    const handleTaskUncomplete = async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: false, completed_at: null })
            .eq('id', taskId)

        if (!error) {
            loadWeekTasks(true)
        }
    }

    const handleTaskStyleSave = async (style: { color: string; border: string }) => {
        const task = styleModalConfig.task
        if (!task) return

        const updatedMetadata = {
            ...task.metadata,
            style: style
        }

        const { error } = await supabase
            .from('tasks')
            .update({ metadata: updatedMetadata })
            .eq('id', task.id)

        if (!error) {
            loadWeekTasks(true)
        }
    }

    // Flatten all tasks for finding active task during drag
    const dataFlatten: Task[] = []
    weekTasks.forEach(tasks => dataFlatten.push(...tasks))
    specializedTasks.forEach(tasks => dataFlatten.push(...tasks))

    const isThisWeek = () => {
        const today = new Date()
        const target = getStartOfWeek(today)
        return currentWeekStart.getTime() === target.getTime()
    }

    const findContainer = (id: string) => {
        if (weekTasks.has(id)) return id

        // Handle specialized groups
        if (id.startsWith('group-')) {
            // ID format: group-type-YYYY-MM-DD
            // But verify: group-nutrition-2023-11-20
            // Since type is variable length, we should use regex or fixed structure if possible.
            // ID construction: `group-${type}-${dateStr}`
            // Let's assume dateStr is always at the end (10 chars).
            // Actually, simply returning the date part is safer if we encoded it well.
            const parts = id.split('-')
            // Reconstruct date from last 3 parts: YYYY-MM-DD
            if (parts.length >= 5) {
                return `${parts[parts.length - 3]}-${parts[parts.length - 2]}-${parts[parts.length - 1]}`
            }
        }

        const task = dataFlatten.find(t => t.id === id)
        if (task) return task.due_date
        // Fallback for date strings that aren't in map yet but are valid format YYYY-MM-DD
        if (id.match(/^\d{4}-\d{2}-\d{2}$/)) return id
        return null
    }

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id)
    }

    const handleDragOver = (event: any) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        // Find the containers
        const activeContainer = findContainer(activeId as string)
        const overContainer = findContainer(overId as string)

        if (!activeContainer || !overContainer) return

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
        } else {
            // Reorder within the same container
            const items = weekTasks.get(activeContainer) || []
            const oldIndex = items.findIndex(i => i.id === activeId)
            const newIndex = items.findIndex(i => i.id === overId)

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                setWeekTasks(prev => {
                    const newMap = new Map(prev)
                    const updatedItems = arrayMove(items, oldIndex, newIndex)
                    newMap.set(activeContainer, updatedItems)
                    return newMap
                })
            }
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) {
            loadWeekTasks(true)
            return
        }

        const activeId = active.id as string
        const overId = over.id as string
        const activeContainer = findContainer(activeId)
        const overContainer = findContainer(overId)

        if (!activeContainer || !overContainer) return

        // 1. Check if we dropped ONTO a group container (Nesting)
        const overTask = dataFlatten.find(t => t.id === overId)
        const activeTask = dataFlatten.find(t => t.id === activeId)

        if (overTask && overTask.metadata?.is_group === true && activeId !== overId) {
            // Nest active task into overTask
            const { error } = await supabase
                .from('tasks')
                .update({
                    parent_id: overId,
                    due_date: overContainer // Ensure it has same date as parent
                })
                .eq('id', activeId)

            if (!error) {
                loadWeekTasks(true)
                return
            }
        }

        // 2. Regular Reordering / Moving / Extraction
        // Determine the target parent_id
        let targetParentId: string | null = null
        if (overTask) {
            targetParentId = overTask.parent_id || null
        }

        const containersToUpdate = new Set([activeContainer, overContainer])

        for (const container of containersToUpdate) {
            const items = weekTasks.get(container) || []
            for (let i = 0; i < items.length; i++) {
                const task = items[i]
                const updateData: any = {
                    sort_order: i,
                    due_date: container
                }

                // If this is the active task, update its parent_id to match its new environment
                if (task.id === activeId) {
                    updateData.parent_id = targetParentId
                }

                const { error } = await supabase
                    .from('tasks')
                    .update(updateData)
                    .eq('id', task.id)

                // RECURSION: Keep children synced to parent's date
                if (!error && task.metadata?.is_group === true) {
                    await supabase
                        .from('tasks')
                        .update({ due_date: container })
                        .eq('parent_id', task.id)
                }
            }
        }

        loadWeekTasks(true)
    }

    const weekDaysArr = getDaysInWeek()
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
            <div className="flex items-center justify-between bg-white/50 p-2 rounded-2xl border border-white/20">
                <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-white rounded-xl transition-all active:scale-90 text-gray-400 hover:text-indigo-600 shadow-sm border border-transparent hover:border-gray-100">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="text-center">
                    <h2 className="text-base font-black text-gray-900 capitalize tracking-tight">{monthName}</h2>
                    {!isThisWeek() && (
                        <button onClick={goToThisWeek} className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:text-indigo-800 transition">
                            Bu Hafta
                        </button>
                    )}
                </div>

                <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-white rounded-xl transition-all active:scale-90 text-gray-400 hover:text-indigo-600 shadow-sm border border-transparent hover:border-gray-100">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Week Grid */}
            <DndContext
                sensors={sensors}
                collisionDetection={customCollisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {weekDaysArr.map((date) => {
                        const dateStr = toLocalISOString(date)
                        const tasksForDay = weekTasks.get(dateStr) || []
                        const specTasksForDay = specializedTasks.get(dateStr) || []
                        const isDayToday = isToday(date)
                        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' })

                        return (
                            <DroppableDay key={dateStr} id={dateStr} isToday={isDayToday}>
                                <div className="flex flex-col h-full">
                                    {/* Day Header - Compact & Non-interactive */}
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                                        <div className={`text-sm font-bold truncate ${isDayToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                                            {dayName} <span className={`ml-1 font-normal ${isDayToday ? 'text-indigo-800' : 'text-gray-400'}`}>{date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                        </div>
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
                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                                            title="Görev Ekle"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Specialized Summaries */}
                                    <div className="space-y-1 mb-2">
                                        {specTasksForDay.filter(t => t.task_types?.slug === 'nutrition').length > 0 && (
                                            <DraggableSpecializedSummary
                                                id={`group-nutrition-${dateStr}`}
                                                type="nutrition"
                                            >
                                                <CompactDailyNutrition tasks={specTasksForDay.filter(t => t.task_types?.slug === 'nutrition')} />
                                            </DraggableSpecializedSummary>
                                        )}
                                        {specTasksForDay.filter(t => t.task_types?.slug === 'music').length > 0 && (
                                            <DraggableSpecializedSummary
                                                id={`group-music-${dateStr}`}
                                                type="music"
                                            >
                                                <CompactDailyPractice tasks={specTasksForDay.filter(t => t.task_types?.slug === 'music')} />
                                            </DraggableSpecializedSummary>
                                        )}
                                    </div>

                                    {/* Tasks List */}
                                    <div className="flex-1">
                                        <SortableContext
                                            id={dateStr}
                                            items={buildTaskTree(tasksForDay).map(t => t.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="space-y-2 min-h-[50px]">
                                                {buildTaskTree(tasksForDay).map((task, idx) => (
                                                    <SortableTaskCard
                                                        key={task.id}
                                                        task={task}
                                                        onEdit={() => handleTaskEdit(task)}
                                                        onDelete={() => handleTaskDelete(task.id)}
                                                        onComplete={() => handleTaskComplete(task.id)}
                                                        onUncomplete={() => handleTaskUncomplete(task.id)}
                                                        onStyle={() => setStyleModalConfig({ task: task, isOpen: true })}
                                                        userId={userId}
                                                        onAction={handleTaskAction}
                                                        index={idx}
                                                        activeId={activeId}
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
                                </div>
                            </DroppableDay>
                        )
                    })}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div className="w-[280px]">
                            {activeId.startsWith('group-') ? (
                                (() => {
                                    // Parse activeId to get type and tasks
                                    // activeId: group-type-YYYY-MM-DD
                                    // Wait, we need the tasks.
                                    // The date is in the ID.
                                    const parts = activeId.split('-')
                                    const type = parts[1] // nutrition / music
                                    // Date is the rest: parts[2]-parts[3]-parts[4]
                                    const dateStr = `${parts[2]}-${parts[3]}-${parts[4]}`

                                    const tasks = specializedTasks.get(dateStr)?.filter(t => t.task_types?.slug === type) || []
                                    const Wrapper = type === 'nutrition' ? CompactDailyNutrition : CompactDailyPractice

                                    return (
                                        <div className="bg-white rounded-xl shadow-2xl opacity-90 rotate-2 border-2 border-indigo-400 cursor-grabbing">
                                            <Wrapper tasks={tasks} />
                                        </div>
                                    )
                                })()
                            ) : (
                                dataFlatten.find(t => t.id === activeId) && (
                                    <TaskCard
                                        task={dataFlatten.find(t => t.id === activeId) as any}
                                        onEdit={() => { }}
                                        onDelete={() => { }}
                                        onComplete={() => { }}
                                        onUncomplete={() => { }}
                                    />
                                )
                            )}
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

            {styleModalConfig.isOpen && styleModalConfig.task && (
                <TaskStyleModal
                    currentStyle={styleModalConfig.task.metadata?.style}
                    onSave={handleTaskStyleSave}
                    onClose={() => setStyleModalConfig({ task: null, isOpen: false })}
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
            className={`group flex flex-col gap-2 min-h-[450px] rounded-xl p-3 border transition-colors ${isOver
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
